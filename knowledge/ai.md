# AI & Machine Learning Questions

100 high-frequency interview questions covering machine learning fundamentals, deep learning, NLP, LLMs, generative AI, MLOps, model serving, evaluation, and AI systems engineering.

---

### 1. Bias-variance tradeoff

**Frequency:** High

**Question:** Explain the bias-variance tradeoff. How do you diagnose whether a model is bias- or variance-limited?

**Answer:** Generalization error decomposes into three parts: **bias** (error from wrong modeling assumptions — the model is too simple to capture the signal, i.e. underfitting), **variance** (sensitivity to the particular training sample — the fit swings a lot if you resample the data, i.e. overfitting), and **irreducible noise** (inherent randomness in the labels you can never remove). Roughly, expected test error ≈ bias² + variance + noise.

Concrete intuition: fitting a straight line to clearly curved data is **high bias** — it misses the pattern no matter how much data you add. Growing an unpruned decision tree on a few hundred rows is **high variance** — it memorizes noise and changes wildly between samples.

**Diagnosis** is the practical skill: compare training error against validation error. A large gap (low train, high val) means variance/overfitting. Both errors high and close together means bias/underfitting. Both low means you are in good shape.

**The levers differ by problem.** To cut variance: add data, add regularization (L1/L2, dropout, early stopping), or ensemble via bagging. To cut bias: add capacity (deeper/wider models), add features, or ensemble via boosting. Applying the wrong lever (e.g. more regularization on an already-underfit model) makes things worse, which is why diagnosis comes first.

The classical U-shaped curve (error falls, then rises as capacity grows) is complicated by **double descent** in modern overparameterized networks, where pushing well past the interpolation threshold makes test error fall *again*. Even so, the bias-variance framing remains the everyday tool for deciding what to change next.

**Key points:**
- Train/val gap diagnoses bias vs variance.
- Regularization and more data reduce variance.
- Increase capacity or features to reduce bias.
- Double descent appears in overparameterized regimes.

---

### 2. Overfitting and how to prevent it

**Frequency:** High

**Question:** What is overfitting, and how do you prevent it?

**Answer:** Overfitting is when a model captures **training noise** instead of the underlying pattern — it drives training error low but generalizes poorly, so test error stays high. The canonical signal is a train-validation curve that diverges: training loss keeps falling while validation loss flattens then climbs.

**Common causes:** too much model capacity relative to the amount of data, too many features (high-dimensional, low-sample), training too long, a leaky validation setup that lets the model peek at answers, or class imbalance that lets it exploit shortcuts.

**Mitigations, from cheapest to most involved:**
- *More and cleaner data* — the single most effective fix; augmentation (crops, flips, noise, paraphrase) synthesizes it when real data is scarce.
- *Reduce effective capacity* — simpler models, fewer features, or L1/L2 weight decay to penalize large weights.
- *Deep-learning regularizers* — dropout, early stopping, batch/layer norm, and label smoothing are first-line defenses.
- *Honest estimation* — cross-validation and a held-out test set so you measure real generalization.
- *Ensembling* — averaging several models cancels their independent errors.

In deep learning, data augmentation and dropout dominate; in classical/tabular ML, regularization and feature selection do. Above all, keep a **held-out test set untouched** until the final evaluation — tuning against the test set silently leaks information and gives an over-optimistic number that collapses in production.

**Key points:**
- Train low, validation high = overfit.
- Regularization, dropout, early stopping are core tools.
- More/cleaner data beats clever tricks.
- Never tune on the test set.

---

### 3. Train/validation/test split and cross-validation

**Frequency:** High

**Question:** How do you split data into train/validation/test sets, and when do you use cross-validation instead?

**Answer:** The three splits play distinct roles: **training** fits the model parameters, **validation** tunes hyperparameters and selects among models, and **test** gives a single, final, unbiased estimate of generalization. Typical ratios are 70/15/15 or 80/10/10 for large datasets.

When data is **scarce**, a fixed holdout wastes too much of it and gives a noisy estimate. Use **k-fold cross-validation** (k = 5 or 10) instead: rotate which fold is validation so every example is used for both training and validation, then average the k scores for a more stable estimate. The cost is k× the training time.

**The splitting strategy must match the data structure, or you leak:**
- *Classification* — **stratify** on the label so each split preserves the class ratios (critical for imbalanced or small datasets).
- *Time series* — use **forward-chaining** (rolling-window) splits where you always train on the past and validate on the future; a random shuffle lets the model "see the future" and inflates scores.
- *Grouped data* (multiple rows per user/session) — split **by group** so all of a user's rows land on one side; otherwise near-duplicate rows leak from train into test.

The cardinal rule: the test set is touched **once**, at the very end. Every decision you make against it silently leaks information; if you find yourself iterating on test results, carve out a fresh held-out set for the final check.

**Key points:**
- Test set is touched once, at the end.
- Stratify classification; time-order time series.
- Group-aware splits prevent user-level leakage.
- k-fold for small data; holdout for large data.

---

### 4. Regularization: L1 vs L2 vs elastic net

**Frequency:** High

**Question:** Compare L1, L2, and elastic net regularization. When would you choose each?

**Answer:** All three add a penalty on weight magnitude to the loss to discourage overfitting, but they shape the weights differently.

**L2 (ridge)** adds `lambda * sum(w^2)`. The gradient shrinks weights smoothly and proportionally toward zero but rarely *to* zero, so it keeps all features with small, stable coefficients. It handles multicollinearity gracefully and has a clean closed-form solution. Choose it for dense signals where most features carry some information and you want stable predictions.

**L1 (lasso)** adds `lambda * sum(|w|)`. Its constant-magnitude gradient drives many weights **exactly to zero**, performing implicit feature selection and yielding a sparse, interpretable model. The downside: among a group of correlated features it arbitrarily keeps one and zeroes the rest, which can be unstable. Choose it when you want a compact model or to identify which features matter.

**Elastic net** combines both: `lambda * (alpha * L1 + (1 - alpha) * L2)`. It gets L1's sparsity plus L2's stability, and crucially can **select whole groups** of correlated features together rather than arbitrarily picking one. Choose it when features are correlated and you still want sparsity — common in genomics and other wide datasets.

In neural networks, L2 is standard and called **weight decay**. A subtlety: with adaptive optimizers, adding L2 to the loss interacts badly with the per-parameter learning-rate scaling. **AdamW** fixes this by *decoupling* weight decay — applying it directly to the weights rather than through the gradient — which is why AdamW is the modern default. Tune `lambda` (and `alpha`) by cross-validation.

**Key points:**
- L1 = sparsity; L2 = shrinkage; elastic net = both.
- L1 picks arbitrarily among correlated features.
- AdamW decouples weight decay from adaptive steps.
- Lambda tuned by cross-validation.

---

### 5. Feature engineering and feature selection

**Frequency:** High

**Question:** Discuss feature engineering and feature selection. Why is data leakage the critical danger?

**Answer:** **Feature engineering** creates predictive signal from raw data. Common techniques: encoding categoricals (one-hot for low cardinality, target/mean encoding or learned embeddings for high cardinality), scaling numerics (standardize or min-max), binning continuous values, building interaction and polynomial terms, applying log/Box-Cox transforms to skewed variables, decomposing dates (day-of-week, is-holiday), and domain-specific aggregations (e.g. a user's 30-day average spend).

**Feature selection** prunes redundant or noisy inputs to reduce overfitting and speed up training. Three families:
- *Filter* methods score each feature independently (correlation, mutual information, chi-square) — fast but ignore interactions.
- *Wrapper* methods search subsets by retraining the model (forward/backward selection, RFE) — accurate but expensive.
- *Embedded* methods select as a side effect of training (L1 regularization, tree feature importance) — a practical middle ground.

Modern deep learning offloads much of this to **representation learning**, but tabular problems still win or lose on feature quality.

**Leakage is the silent killer.** Any transform that uses target statistics — target encoding, mean imputation, scaling parameters, even the vocabulary for a TF-IDF — must be *fit on the training folds only* and then applied to validation/test. Fitting on the full dataset lets information about the answers seep into your features, producing spectacular offline scores that collapse in production. The safe pattern is to wrap every such transform in a pipeline that is refit inside each cross-validation fold.

**Key points:**
- Tabular ML lives and dies by features.
- Leakage is the silent killer; fit transforms on train only.
- Embeddings replace one-hot for high-cardinality categoricals.
- L1 and tree importance are practical embedded selectors.

---

### 6. Handling class imbalance

**Frequency:** High

**Question:** How do you handle class imbalance in a classification problem?

**Answer:** When one class dominates — fraud at 0.1%, disease at 1% — a model that always predicts the majority class scores 99%+ accuracy while catching zero positives. So the first move is to **stop using accuracy** and pick metrics that reflect the minority class: precision-recall AUC, F1, recall@k, or an explicit cost-weighted metric.

**Remedies, roughly in order of preference:**
- *Class weights* — tell the loss to penalize minority errors more (`class_weight='balanced'` in sklearn, `pos_weight` in PyTorch). Cheap, safe, and touches no data. Usually try this first.
- *Threshold tuning* — the default 0.5 cutoff is arbitrary; move it along the precision-recall curve to hit your target recall or precision. Often the single biggest, simplest win.
- *Resampling* — oversample the minority (SMOTE/ADASYN synthesize interpolated points), undersample the majority, or both. Effective but riskier.
- *Focal loss* — down-weights easy examples so training focuses on the hard minority cases; common in object detection.

**Pitfalls that bite people:**
- SMOTE in high dimensions creates unrealistic synthetic points between far-apart neighbors.
- **Oversampling before the split leaks** — synthetic copies of a test point end up in training. Always resample *inside* each CV fold, after splitting.

For extreme imbalance (1 in 10^5), pure rebalancing struggles; an **anomaly-detection** framing or a **two-stage** pipeline (a high-recall cheap filter feeding a precise classifier) usually beats it.

**Key points:**
- Accuracy lies under imbalance; use PR-AUC, F1, recall@k.
- Class weights cheaper and safer than synthetic oversampling.
- Threshold tuning often the simplest big win.
- SMOTE inside CV folds, never before splitting.

---

### 7. Classification metrics: precision, recall, F1, ROC-AUC, PR-AUC

**Frequency:** High

**Question:** Define precision, recall, F1, ROC-AUC, and PR-AUC. How do you pick which to optimize?

**Answer:** Start from the confusion matrix (TP, FP, FN, TN):
- **Precision** = TP/(TP+FP): of everything you flagged positive, how much was right. Rises when you avoid false alarms.
- **Recall** (sensitivity) = TP/(TP+FN): of all actual positives, how many you caught. Rises when you avoid misses.
- **F1** = harmonic mean of precision and recall — a single number that punishes a model that sacrifices one for the other.

Precision and recall **trade off through the decision threshold**: lower it and you catch more positives (higher recall) but with more false alarms (lower precision), and vice versa. That's why a single operating point rarely tells the whole story.

**Threshold-independent summaries:**
- **ROC-AUC** plots true-positive rate vs false-positive rate across all thresholds; it measures ranking quality and is invariant to class balance — but that invariance makes it *optimistically flat* under heavy imbalance, because the huge true-negative count keeps FPR low.
- **PR-AUC** plots precision vs recall and is far more informative when positives are rare, since it ignores true negatives entirely.

**Picking the metric follows the cost of errors:** cancer screening prioritizes recall (a miss is deadly, a false alarm just means another test); spam filtering prioritizes precision (flagging a real email is worse than letting spam through); ranking/recommendation uses AUC or NDCG. Always report **several** metrics plus the confusion matrix, and tune the threshold to your real operating constraint rather than defaulting to 0.5.

**Key points:**
- Precision and recall trade off via threshold.
- PR-AUC > ROC-AUC under heavy imbalance.
- Accuracy alone is rarely sufficient.
- Confusion matrix shows the actual error mix.

---

### 8. Data leakage

**Frequency:** High

**Question:** What is data leakage, what forms does it take, and how do you prevent it?

**Answer:** Leakage is when information the model wouldn't have at prediction time sneaks into training. It produces validation scores that look great and then collapse in production — the most expensive class of ML bug because it hides until deployment.

**Common forms:**
- *Target leakage* — a feature is derived from or proxies the label. Classic example: `was_refunded` in a fraud model, or including a `diagnosis_date` field when predicting diagnosis.
- *Train-test contamination* — fitting preprocessing (scalers, encoders, imputers, PCA) on the full dataset before splitting, so test statistics leak into training features.
- *Temporal leakage* — using future information to predict the past, or a random split on time-ordered data.
- *Group leakage* — the same user/patient/device appears in both train and test, so the model memorizes the entity rather than the pattern.
- *Duplicate rows* straddling the split.

**Symptoms:** validation that's "too good to be true," a single feature dominating importance, or a large gap between offline and online performance.

**Prevention:** split *first*, then fit every transform on the training folds only (wrap them in a pipeline refit per fold); use **time-aware** splits for temporal data and **group-aware** splits for grouped data; and read your top features critically — if one predicts almost perfectly, suspect it encodes the answer. Whenever offline beats online by a wide margin, assume leakage until proven otherwise.

**Key points:**
- Split first, transform later.
- Suspicious top features often = leakage.
- Time- and group-aware splits prevent silent leakage.
- Offline-to-online gap is the canonical symptom.

---

### 9. Logistic regression

**Frequency:** High

**Question:** How does logistic regression work, and why is it still a strong production baseline?

**Answer:** Despite the name it's a **classifier**. It computes a linear score `z = w·x + b` and squashes it through a **sigmoid** `1/(1+e^-z)` to get a probability between 0 and 1 (for multi-class, **softmax** generalizes this). You predict the positive class when the probability crosses a threshold.

**Fitting:** maximize the log-likelihood of the labels, equivalently minimize **cross-entropy** loss. This objective is **convex**, so gradient descent reaches a single global optimum — no random restarts, no local minima. There's no closed form (unlike linear regression), but it converges reliably.

**Why it's beloved in production:**
- *Calibrated probabilities* — the outputs are meaningful likelihoods, not just scores, which matters for ranking, thresholding, and expected-value decisions.
- *Interpretability* — each coefficient is a log-odds effect: exponentiate it to get an odds ratio you can explain to a regulator or product owner.
- *Scales to huge sparse feature spaces* — text and ad-click features with millions of dimensions train fast.
- Regularize with L1 (sparsity), L2 (shrinkage), or elastic net.

**Limitations:** the decision boundary is **linear** in feature space (add interaction/polynomial features or a kernel to capture curvature), it's sensitive to outliers and multicollinearity, and it assumes roughly independent observations. Even so, for click prediction, credit scoring, and any setting where calibrated, explainable probabilities beat a few points of raw accuracy, it remains the default baseline every serious model is measured against.

**Key points:**
- Convex, calibrated, interpretable.
- Strong baseline for high-dim sparse problems.
- Add interactions or kernel to fight linearity limit.
- Regularize to handle collinearity and overfit.

---

### 10. Decision trees

**Frequency:** High

**Question:** How do decision trees work, and why are they the building block for ensembles?

**Answer:** A decision tree recursively **partitions the feature space** with axis-aligned splits. At each node it greedily picks the feature and threshold that best separate the data, measured by an **impurity criterion**: information gain (entropy reduction) or Gini impurity for classification, variance reduction for regression. It keeps splitting until a stopping rule fires, and each leaf predicts the majority class or mean value of the examples that land there.

**Strengths:** it handles mixed numeric/categorical types and non-linear relationships **without scaling**, tolerates missing values, captures interactions naturally, and — if kept shallow — is genuinely interpretable as a flowchart of rules.

**The fatal weakness is high variance.** A greedy tree grown to full depth memorizes noise, and a small change in the data can flip the top split and produce a completely different tree. You control this with hyperparameters: `max_depth`, `min_samples_leaf`, `min_samples_split`, and cost-complexity pruning (`ccp_alpha`). Greedy top-down splitting can also miss interactions that only pay off after two splits.

Because a single tree is unstable but cheap and expressive, it's the perfect **base learner for ensembles**. Averaging many decorrelated trees (**bagging** → random forests) slashes variance; building trees sequentially to fix predecessors' errors (**boosting** → XGBoost/LightGBM/CatBoost) slashes bias. Those tree ensembles are still the state of the art on most tabular problems.

**Key points:**
- Greedy splits on impurity; no scaling required.
- High variance alone; ensemble for power.
- max_depth and min_samples_leaf control overfit.
- Foundation for RF and gradient boosting.

---

### 11. Random forests

**Frequency:** High

**Question:** How do random forests work, and why do they perform so well with little tuning?

**Answer:** A random forest is an ensemble of decision trees combined through **bagging** (bootstrap aggregating) with an extra twist. Each tree trains on a **bootstrap sample** (n rows drawn with replacement), and at every split the tree may only consider a **random subset of features** (typically √p for classification, p/3 for regression). Predictions are averaged for regression or majority-voted for classification.

The key insight is **decorrelation**. Plain bagging alone leaves trees correlated because a few strong features dominate the top splits of every tree. Restricting the feature choice per split forces trees to be different, and averaging many diverse trees cancels their independent errors — driving ensemble variance far below any single tree's while keeping bias roughly the same.

**Practical benefits:**
- *Robustness* — tolerant of outliers, mixed feature types, and non-linear interactions, with almost no preprocessing (no scaling needed).
- *Built-in feature importance* — from impurity decrease or, better, permutation importance.
- *Out-of-bag (OOB) error* — each tree can be validated on the ~37% of rows it didn't see, giving a free validation estimate without a separate holdout.

**Tradeoffs:** less interpretable than one tree, larger and slower to serve than a linear model, and usually a touch weaker than well-tuned gradient boosting on tabular benchmarks. But because it works well out of the box with minimal tuning, it's the ideal strong, low-maintenance tabular baseline.

**Key points:**
- Bagging + random feature subsets = decorrelated trees.
- Out-of-bag samples give free validation estimate.
- Less tuning than boosting; often slightly weaker.
- Robust default for tabular problems.

---

### 12. Gradient boosting: XGBoost, LightGBM, CatBoost

**Frequency:** High

**Question:** Explain gradient boosting, and compare XGBoost, LightGBM, and CatBoost.

**Answer:** Gradient boosting builds trees **sequentially**, each one trained to correct the errors of the ensemble so far. Concretely, you compute the gradient of the loss with respect to the current predictions (for squared error this is just the residuals), fit a new shallow tree to those gradients, and add it scaled by a small **learning rate**. Repeating this performs gradient descent in function space. Unlike bagging (which reduces variance by averaging), boosting reduces **bias** by relentlessly fitting what's left over — which is why boosted trees usually top tabular benchmarks.

**The three dominant libraries differ in their innovations:**
- **XGBoost** — uses **second-order** gradients (Newton steps), built-in L1/L2 regularization, sparsity-aware split finding, and heavy engineering for parallelism. The robust, battle-tested default.
- **LightGBM** — **histogram-based** binning plus **leaf-wise** (best-first) growth instead of level-wise, making it dramatically faster on large datasets. Watch overfitting on small data (cap `num_leaves`).
- **CatBoost** — handles **categorical features natively** via ordered target encoding that avoids the target leakage naive encoding causes, and uses symmetric trees. Best when you have many high-cardinality categoricals and want minimal preprocessing.

**Key hyperparameters** and how they interact: number of trees (use **early stopping** on a validation set), **learning rate** (smaller rate + more trees generalizes better but trains slower — tune them jointly), tree size (`max_depth` or `num_leaves`), row/column **subsampling** for regularization, and L1/L2 penalties. The tradeoff versus random forests: boosting is more accurate but more sensitive to hyperparameters and easier to overfit, and its sequential nature makes training less parallelizable.

**Key points:**
- Sequential trees on residual gradients.
- LightGBM fastest; CatBoost best for categoricals.
- Tune trees + LR jointly with early stopping.
- Tabular ML's gold standard.

---

### 13. K-means clustering

**Frequency:** High

**Question:** How does k-means clustering work, what are its assumptions, and when do you prefer alternatives?

**Answer:** K-means partitions n points into k clusters by minimizing the **within-cluster sum of squared distances** to cluster centroids. **Lloyd's algorithm** solves it by alternating two steps until assignments stop changing: (1) *assign* each point to its nearest centroid, (2) *update* each centroid to the mean of its assigned points. It's fast and always converges, but only to a **local** optimum, so the initialization matters.

**Practical concerns:**
- *Choosing k* — k must be fixed up front. Use the **elbow** method (plot inertia vs k, look for the bend), **silhouette** score, or the **gap statistic**.
- *Initialization* — **k-means++** spreads initial centroids apart, avoiding the poor local minima that random seeding causes. Run several seeds and keep the best.
- *Scaling* — because it uses Euclidean distance, **always standardize** features first, or large-scale features dominate.
- *Outliers* — means are sensitive to them; consider k-medoids.
- *Scale* — mini-batch k-means handles very large datasets.

**The core assumption is spherical, similarly-sized, linearly separable clusters.** When clusters are elongated, density-varying, or non-convex, k-means fails badly — reach for **DBSCAN/HDBSCAN** (density-based, finds arbitrary shapes and marks noise, no k needed) or **spectral clustering** (uses a similarity graph). Typical good uses: customer segmentation, vector quantization, image color compression, and anchor-box selection.

**Key points:**
- Assumes spherical equal-size clusters.
- k-means++ init avoids bad local minima.
- Pick k via elbow or silhouette.
- DBSCAN/HDBSCAN for arbitrary shapes.

---

### 14. PCA: principal component analysis

**Frequency:** High

**Question:** How does PCA work, what is it used for, and what are its limitations?

**Answer:** PCA is **linear dimensionality reduction** that finds a new set of orthogonal axes — the **principal components** — ordered by how much variance in the data they capture. The first component is the direction of maximum variance, the second is the maximum-variance direction orthogonal to it, and so on. Projecting onto the top few components keeps most of the signal in far fewer dimensions.

**Computation:** center the data, then take the **SVD** of the data matrix (numerically preferred) or the **eigendecomposition** of the covariance matrix. The eigenvalues give the variance explained by each component, so you can pick how many to keep by a target like "95% of variance."

**Use cases:** visualization (project to 2–3D), **denoising** (drop low-variance components that are mostly noise), **decorrelation** of features, and **compression** to speed up downstream distance-based models.

**Limitations:**
- *Linear only* — it can't capture curved manifolds; use **kernel PCA** or **autoencoders** for non-linear structure.
- *Uninterpretable components* — each is a mix of all original features.
- *Scale-sensitive* — you must **standardize first**, or high-variance features hijack the components.
- *Unsupervised* — it maximizes variance, not class separation, so discarded components may carry label information and hurt a supervised model.

For *visualizing* non-linear cluster structure, prefer **t-SNE** or **UMAP**; for compression with faithful reconstruction, PCA remains the workhorse.

**Key points:**
- Maximizes variance along orthogonal axes.
- Standardize features first.
- Linear only; use kernel PCA or autoencoders for nonlinear.
- Pick components by cumulative variance explained.

---

### 15. Backpropagation

**Frequency:** High

**Question:** Explain backpropagation and its main practical issues.

**Answer:** Backpropagation is **reverse-mode automatic differentiation**: an efficient way to compute the gradient of a scalar loss with respect to *every* parameter in one backward sweep. The network is a **computation graph** of operations; the **forward pass** runs it to produce activations and the loss, and the **backward pass** walks the graph in reverse topological order, applying the **chain rule** to propagate `dL/d(output)` backward and accumulate `dL/d(param)` at each node.

The efficiency is the whole point: naively perturbing each of N parameters would cost N forward passes, but reverse-mode gets all N gradients in a single backward pass costing only **~2× the forward pass**. This is what makes training billion-parameter models feasible. Frameworks like PyTorch autograd, JAX, and TensorFlow build the graph (dynamically or traced) and run this automatically.

**Key practical issues:**
- *Numerical stability* — exponentials and logs overflow/underflow; use tricks like **log-sum-exp** and fused ops (e.g. softmax+cross-entropy computed together).
- *Vanishing/exploding gradients* — in deep nets the repeated multiplication shrinks or blows up gradients; mitigated by ReLU, batch/layer norm, residual connections, and careful initialization.
- *Memory* — the backward pass needs the forward activations, so memory scales with depth. **Gradient checkpointing** trades compute for memory by recomputing activations during the backward pass instead of storing them all.

Conceptually backprop is "just" the chain rule applied systematically — but that systematic application is the foundation of all modern deep learning.

**Key points:**
- Reverse-mode autodiff via chain rule.
- Cost ~ 2x forward pass.
- Memory bottleneck handled by gradient checkpointing.
- Stable activations and normalization keep gradients flowing.

---

### 16. Gradient descent variants: SGD, momentum, Adam, AdamW

**Frequency:** High

**Question:** Compare SGD, momentum, Adam, and AdamW. Which tends to generalize best where?

**Answer:** All are variants of gradient descent `w := w - lr * grad`; they differ in how they use the history of gradients.

- **SGD (mini-batch)** — the plain update on a batch. The batch-to-batch noise is a feature: it helps the optimizer escape sharp minima and often lands in flatter, better-generalizing ones. But pure SGD is slow through ravines and plateaus.
- **Momentum** — accumulates an exponential moving average of past gradients (β ≈ 0.9) and steps along that. It accelerates in consistent directions and damps oscillations, like a heavy ball rolling downhill. **Nesterov** momentum peeks ahead to where momentum is carrying you before computing the gradient, giving a slightly better correction.
- **Adaptive family** — **Adagrad** scales each parameter's learning rate by the inverse square root of its accumulated squared gradients (great for sparse features, but the rate decays to zero and training stalls). **RMSProp** fixes that by using an EMA of squared gradients instead of a sum.
- **Adam** — combines **momentum** (first moment) with **RMSProp** (second moment) plus bias correction for the early steps. Fast, robust, and the go-to default.
- **AdamW** — fixes a subtle bug: adding L2 to the loss doesn't equal true weight decay under Adam's per-parameter scaling. AdamW **decouples** weight decay, applying it directly to the weights, which improves generalization and is now standard for transformers.

**Rules of thumb:** well-tuned **SGD + momentum** often generalizes best in computer vision; **Adam/AdamW** dominate NLP, transformers, and large-scale training where robustness to hyperparameters matters. Across all of them, the **learning rate is the single most important hyperparameter** — tune it first, usually with warmup and a decay schedule.

**Key points:**
- SGD+momentum: best generalization in many vision settings.
- Adam: fast convergence, good default.
- AdamW fixes weight-decay coupling in Adam.
- LR is the single most important hyperparameter.

---

### 17. Batch normalization

**Frequency:** High

**Question:** Explain batch normalization: what it does, how it behaves at inference, and its pitfalls.

**Answer:** Batch norm normalizes a layer's pre-activations **across the batch dimension** — for each feature it subtracts the batch mean and divides by the batch standard deviation — then applies a **learned scale `γ` and shift `β`** so the network can undo the normalization if it helps. This keeps activations well-scaled layer to layer.

**Benefits:** it stabilizes and speeds up training, permits **higher learning rates**, reduces sensitivity to initialization, and acts as mild regularization (each example's normalization depends on the random batch it landed in). It's a major reason deep CNNs became easy to train.

**At inference** there's no batch to compute statistics from, so BN uses **running (moving) averages** of the mean and variance collected during training. This is why the layer behaves differently in train vs eval mode.

**Pitfalls:**
- *Batch-size dependence* — with tiny batches the batch statistics are noisy and BN degrades; useless at batch size 1 (some fine-tuning setups).
- *The train/eval mode bug* — forgetting `model.eval()` at inference (or `model.train()` when training) uses the wrong statistics and silently wrecks accuracy — a classic bug.
- *Poor fit for sequences* — variable-length RNN/transformer activations don't have a stable batch distribution.

**Alternatives** that don't normalize over the batch: **layer norm** (per-sample, over features — standard in transformers), **group norm** (over groups of channels — good for small-batch vision), and **instance norm** (per-channel per-sample — style transfer). BN is still the default in CNN backbones; LN rules transformers.

**Key points:**
- Normalizes across batch; learns gamma/beta.
- Bad for small batches; switch to GroupNorm/LayerNorm.
- Train/eval mode mismatch is a classic bug.
- CNNs use BN; transformers use LN.

---

### 18. Prompt engineering vs RAG vs fine-tuning: choosing an approach

**Frequency:** High

**Question:** A product team wants an LLM feature and asks whether they should invest in prompt engineering, RAG, or fine-tuning. Walk through how you decide.

**Answer:** The first move is to diagnose the *type* of gap, not to pick a favorite technique. Ask: is the model missing **knowledge** (facts it never saw, or data that changes), or is it missing **behavior** (a consistent format, tone, or skill)? That single question routes most of the decision.

**Prompt engineering (incl. few-shot)** is the default starting point. It is free, iterates in minutes, and often gets you 80% of the way. Use clear instructions, a system prompt that pins role and constraints, and 2-5 few-shot examples to lock format. Reach for it first for prototypes, and always exhaust it before spending money — many "we need fine-tuning" problems are solved by a better prompt and structured output (JSON schema / function calling). Limits: prompts get long (cost/latency), and you can't teach genuinely new skills with words alone.

**RAG** is the right tool for **facts and freshness**. When answers depend on private docs, product data, or anything that changes, put the knowledge in a vector store (e.g. pgvector, Pinecone, Qdrant) plus keyword/hybrid retrieval, and inject the top-k chunks at query time. Update the knowledge base and the answers change immediately — no retraining. It also gives you citations and reduces hallucination. Cost: retrieval infra, chunking/embedding pipeline, and context tokens per call.

**Fine-tuning (SFT / LoRA)** is better for baking in **style, format, or skill** — a house tone, a rigid output schema, a niche classification task, or compressing a long prompt into weights to cut latency. LoRA/QLoRA make this cheap (a few hundred to a few thousand labeled examples, hours on one GPU). The classic mistake is **fine-tuning to add facts**: it's expensive, the facts go stale, and the model still hallucinates the gaps. Facts → RAG; behavior → fine-tune.

**They combine.** A mature system often does RAG *and* fine-tuning: fine-tune for domain phrasing and reliable formatting, RAG for the live knowledge. A common progression: prompt → prompt + RAG → add fine-tuning only when prompting plateaus on behavior.

**Decision checklist:** Does it need current/private data? → RAG. Does output format/style/skill need to be consistent and can't be prompted reliably? → fine-tune. Just validating an idea? → prompting. High volume where a shorter prompt saves real money? → fine-tune to shrink context. Weigh maintenance too: prompts are cheapest to change, RAG needs a data pipeline, fine-tunes need retraining on model upgrades.

**Key points:**
- Diagnose the gap first: knowledge/freshness → RAG; behavior/style/skill → fine-tune; quick prototype → prompting.
- Exhaust prompt engineering (few-shot, structured output) before paying for RAG or fine-tuning.
- Don't fine-tune to add facts — it's costly, goes stale, and still hallucinates; use RAG.
- Mature systems combine them; factor in maintenance cost (prompt < RAG < fine-tune).

---

### 19. Vanishing and exploding gradients

**Frequency:** High

**Question:** What causes vanishing and exploding gradients, and how do you fix them?

**Answer:** Backprop computes gradients by **multiplying** many per-layer Jacobians together through the chain rule. If those factors are consistently **less than 1**, the product shrinks exponentially with depth and gradients **vanish**; if consistently **greater than 1**, the product blows up and gradients **explode**. Saturating activations (sigmoid/tanh flatten to near-zero slope) and small weights cause vanishing; large weights and recurrence cause exploding.

**Consequences:** vanishing gradients mean early layers get almost no signal and effectively stop learning — the network trains its last layers only. Exploding gradients produce wild updates and **NaN loss**.

**Symptoms to watch:** loss suddenly becomes NaN/Inf (exploding), or the loss plateaus while early-layer weights barely move (vanishing). The reliable diagnostic is to **monitor per-layer gradient norms** — exploding is obvious, vanishing is subtler and shows as norms decaying toward zero in early layers.

**Standard mitigations:**
- *Non-saturating activations* — **ReLU** and variants avoid the flat regions that kill gradients.
- *Normalization* — **batch/layer norm** keeps activations well-scaled so Jacobians stay near 1.
- *Residual connections* — skip paths act as a "gradient highway," letting signal flow directly to early layers.
- *Proper initialization* — **He** (ReLU) or **Xavier/Glorot** (tanh) keep initial variance stable across layers.
- *Gradient clipping* — cap the global gradient norm (e.g. at 1.0) to stop explosions; essential for RNNs and LLM training.
- *Gated RNNs* — **LSTM/GRU** cell states create a near-constant error carousel that resists vanishing over long sequences.

Modern transformer training combines pre-norm, AdamW, learning-rate warmup, and clipping to keep gradients healthy.

**Key points:**
- Symptoms: NaN loss, early-layer weights frozen.
- ReLU + norm + residuals + clipping = standard fix.
- LSTM gates designed specifically for vanishing.
- Monitor gradient norms per layer.

---

### 20. Attention mechanism

**Frequency:** High

**Question:** Explain the attention mechanism and why multi-head attention helps.

**Answer:** Attention lets each position in a sequence build its representation by **pulling in information from other positions based on content**, rather than a fixed window. Every token emits three vectors: a **query** (what am I looking for), a **key** (what do I offer), and a **value** (the information I carry). The output for a position is a weighted average of all values, where the weight is how well that position's query matches each key.

The concrete formula is **scaled dot-product attention**:

`Attention(Q, K, V) = softmax(QK^T / √d_k) V`

The `QK^T` computes all pairwise query-key similarities; dividing by `√d_k` keeps the dot products from growing large (which would push softmax into saturated, low-gradient regions); softmax turns them into weights that sum to 1; multiplying by `V` produces the weighted blend. In **self-attention**, Q, K, and V all come from the same sequence, so tokens attend to each other.

**Multi-head attention** runs `h` attention operations in parallel, each with its own learned projections, then concatenates the results. This lets different heads specialize — one might track syntactic dependencies, another coreference, another positional patterns — capturing several relationship types at once instead of averaging them into a single attention pattern.

The catch is **cost**: computing all pairwise interactions is **O(n²·d)** in sequence length `n`, which is why long-context work pursues sparse, low-rank, and linear-attention approximations (and why FlashAttention optimizes the memory access). Replacing recurrence with attention — which is fully parallelizable across positions — is exactly what made the transformer scalable and displaced RNNs.

**Key points:**
- Softmax(QK^T / sqrt(d_k)) V.
- Multi-head captures multiple relation types.
- O(n^2) cost drives long-context research.
- Self-attention replaced recurrence in transformers.

---

### 21. Debugging a deep model that won't converge

**Frequency:** High

**Question:** You start training a deep network and the loss won't come down — it's flat, oscillating wildly, or turns into NaN within a few steps. Walk me through how you'd systematically debug this.

**Answer:** The golden rule: **don't guess, isolate.** Work from the cheapest, most common causes to the rare ones, and change one thing at a time.

**1. Overfit a single batch first.** Before anything else, take 4-8 examples and train until the loss goes to ~0. This one test exercises the whole pipeline — model, loss, optimizer, backprop. If you *can't* overfit a tiny batch, the bug is in your code, not your hyperparameters, and no LR tuning will save you. This alone catches most "won't converge" cases in minutes.

**2. Check the data.** The silent killer. Verify labels are aligned with inputs (off-by-one, wrong column), inputs are normalized (zero-mean/unit-variance or /255), data is shuffled (not sorted by class), and there's no NaN/inf in the raw features. Visualize a few decoded samples with their labels — human eyes catch what asserts miss.

**3. Check the loss.** Confirm it matches the task (CrossEntropy expecting logits vs already-softmaxed probs is a classic). Sanity-check the initial loss: for C balanced classes it should start near **ln(C)** (~2.3 for 10 classes). A wildly wrong starting loss means logits or targets are malformed. Prefer numerically stable forms (log-sum-exp, `BCEWithLogitsLoss`).

**4. Learning rate.** The #1 hyperparameter. **Too high → loss explodes to NaN or oscillates; too low → dead flat.** Run an LR range test (sweep 1e-6→1e-1, plot loss) and pick just below the divergence point. Add warmup for transformers/large batches.

**5. Gradients.** Log per-layer grad norms. **All zeros → vanishing** (dead ReLUs, saturated sigmoids, bad init); **exploding → NaN** (clip to a max norm of ~1.0). Check for `detach()`/no-grad breaking the graph.

**6. Numerics & precision.** FP16/mixed precision overflows easily — use loss scaling (GradScaler) or bf16. A lone `sqrt(0)`, `log(0)`, or divide-by-zero poisons everything downstream; add small epsilons.

**7. Init & normalization.** Use sane init (Kaiming/Xavier). BatchNorm with tiny batches (<8) gives noisy stats — switch to GroupNorm/LayerNorm.

**8. Train/eval mode bugs.** Forgetting `model.train()`/`model.eval()` mangles BatchNorm running stats and dropout, producing loss that looks fine in training but nonsense in validation.

**Key points:**
- Overfit a single batch first — it isolates code bugs from tuning issues.
- Verify data (labels, normalization, shuffling, NaNs) before touching hyperparameters.
- LR is the top suspect: too high → NaN/diverge, too low → stuck; use an LR range test.
- Monitor per-layer grad norms and use clipping; watch FP16 overflow with loss scaling.

---

### 22. CNNs: convolution and pooling

**Frequency:** High

**Question:** Explain convolution and pooling in CNNs, and how CNNs compare with Vision Transformers.

**Answer:** A **convolution** slides a small learned filter (kernel) across the input, computing a dot product at each location to produce a **feature map**. Three properties make this powerful and efficient:
- *Weight sharing* — the same filter is applied everywhere, so a 3×3 filter has 9 weights regardless of image size, versus millions for a fully-connected layer.
- *Translation equivariance* — a feature (edge, texture) is detected wherever it appears.
- *Local receptive fields* — each unit sees a small neighborhood; stacking layers grows the effective receptive field, building hierarchy from edges → textures → parts → objects.

**Stride, padding, and dilation** control geometry: stride > 1 downsamples, padding preserves spatial size at borders, and dilation enlarges the receptive field without adding parameters.

**Pooling** (max or average) downsamples a feature map, giving a degree of translation *invariance* and cutting compute. Modern architectures often replace pooling with **strided convolutions** (learned downsampling). **1×1 convolutions** mix channels without touching spatial dimensions — the cheap bottleneck used in ResNet and Inception.

**CNNs vs Vision Transformers:** ViTs split an image into patches and apply self-attention, and they can outperform CNNs given very large datasets, because they have weaker built-in assumptions (**inductive biases**). But that same lack of bias means ViTs are **data-hungry**; on small/medium datasets CNNs' locality and weight-sharing priors win, and hybrid designs (convolutional stems, ConvNeXt) often give the best efficiency-accuracy tradeoff.

**Key points:**
- Weight sharing + locality = parameter efficiency.
- Pooling provides translation invariance.
- 1x1 conv for channel mixing/bottlenecks.
- ViT competes but convs still strong on small data.

---

### 23. RNNs, LSTMs, GRUs

**Frequency:** High

**Question:** Compare RNNs, LSTMs, and GRUs, and explain why transformers largely replaced them.

**Answer:** An **RNN** processes a sequence one step at a time, maintaining a **hidden state** that carries information forward: `h_t = f(W·x_t + U·h_{t-1})`. Elegant, but backpropagating through many steps multiplies many Jacobians, so **vanilla RNNs suffer vanishing/exploding gradients** and can't learn dependencies more than a handful of steps apart.

**LSTM** fixes this with a separate **cell state** that flows through time with only additive, gated modifications — the "constant error carousel." Three sigmoid **gates** control it: the **forget** gate decides what to drop from the cell, the **input** gate what to add, and the **output** gate what to expose as the hidden state. Because the cell path is mostly linear, gradients survive over long ranges, enabling genuinely long-term memory.

**GRU** simplifies the LSTM: it merges the forget and input gates into a single **update** gate and ties the cell and hidden states together. Fewer parameters and faster, with performance usually comparable to LSTM — a common default when you want an RNN.

**Bidirectional** variants run one pass forward and one backward and concatenate the states, giving each position both past and future context — but only usable in **non-streaming** tasks where the whole sequence is available.

**Why transformers won:** RNNs are inherently **sequential**, so they can't parallelize across time steps on a GPU, and even LSTMs struggle with very long-range dependencies. Self-attention sees all positions at once (parallelizable, direct long-range connections), which is why transformers displaced RNNs for most NLP and speech since 2017–2018. RNNs still appear in **streaming/low-latency** and **on-device** settings where their constant per-step cost and small footprint matter.

**Key points:**
- LSTM gates fix vanishing in vanilla RNN.
- GRU simpler than LSTM, similar performance.
- Sequential = hard to parallelize on GPU.
- Mostly replaced by transformers since 2018.

---

### 24. The Transformer architecture

**Frequency:** High

**Question:** Describe the Transformer architecture and the main upgrades since 2017.

**Answer:** The Transformer (from *Attention Is All You Need*, 2017) is built from stacked identical blocks; a **block** is multi-head self-attention followed by a **position-wise feed-forward network** (two linear layers with a non-linearity), each sub-layer wrapped in a **residual connection + LayerNorm**. Attention mixes information *across* positions; the FFN transforms each position independently.

**Encoder vs decoder:** the **encoder** uses bidirectional self-attention (every token sees every other). The **decoder** adds two things: **masked** self-attention (a token may only attend to earlier positions, so it can't peek at future tokens it's supposed to predict) and **cross-attention** (queries from the decoder attend to encoder outputs). Because attention is order-agnostic, **positional encoding** (sinusoidal or learned) injects sequence order.

**Three variants map to three uses:**
- **Encoder-only** (BERT) — bidirectional understanding: classification, NER, retrieval.
- **Decoder-only** (GPT, LLaMA) — autoregressive generation; now dominant for LLMs.
- **Encoder-decoder** (T5, BART) — sequence-to-sequence: translation, summarization.

**Modern upgrades** since 2017, most visible in LLaMA-style models: **pre-norm** (LayerNorm before the sub-layer, for stable deep training), **RMSNorm** (cheaper normalization), **RoPE** (rotary positional embeddings that encode relative position and extrapolate to longer contexts), **GQA/MQA** (grouped/multi-query attention that shares key-value heads to shrink the KV cache and speed inference), **SwiGLU** FFNs, and **FlashAttention** (an IO-aware exact-attention kernel that removes the memory bottleneck). Notably the core block has stayed remarkably stable — most progress came from **scale, data, and small tweaks** rather than a redesign.

**Key points:**
- Attention + FFN + residual + LayerNorm = a block.
- Encoder, decoder, or both depending on task.
- RoPE, GQA, SwiGLU are modern standard upgrades.
- Architecture stable since 2017; scale did the heavy lifting.

---

### 25. Transfer learning and fine-tuning

**Frequency:** High

**Question:** Walk through transfer learning and fine-tuning. What are the main strategies and tricks?

**Answer:** Transfer learning reuses a model **pretrained on a large general dataset** as the starting point for a smaller, related task — you inherit general representations (edges/textures, or language structure) instead of learning them from scratch, which is why it's the default for almost every modern application.

**Three strategies along a spectrum:**
- *Feature extraction* — **freeze the backbone**, replace and train only a new task head. Fast, cheap, and best when the target dataset is small or very similar to the source.
- *Full fine-tuning* — update **all** parameters with a low learning rate. Highest ceiling when you have enough data, but risks **catastrophic forgetting** of the pretrained knowledge.
- *Layer-wise / gradual unfreezing* — start with the head, then unfreeze layers top-down. A middle ground.

**In NLP** you fine-tune BERT/GPT-style models for classification, NER, or QA; **in vision** you fine-tune ImageNet/JFT/CLIP backbones for detection or classification.

**Key tricks:**
- Use a **much lower LR** on pretrained layers (10–100× smaller than a from-scratch head) so you nudge rather than destroy the learned weights.
- **Discriminative LRs** — lower for early (general) layers, higher for later (task-specific) ones.
- **Warmup** to avoid a large early step wrecking the weights.
- **Freeze early layers** when data is scarce; add dropout/weight decay to fight forgetting.

For LLMs, **parameter-efficient fine-tuning (PEFT)** — LoRA, adapters — has largely replaced full fine-tuning, matching its quality while training a tiny fraction of the weights and fitting on modest hardware.

**Key points:**
- Pretrained backbone + task head = standard recipe.
- Lower LR on pretrained weights.
- LoRA/PEFT replace full fine-tuning for LLMs.
- Catastrophic forgetting mitigated by careful LR/freezing.

---

### 26. LoRA and parameter-efficient fine-tuning (PEFT)

**Frequency:** High

**Question:** Explain LoRA and parameter-efficient fine-tuning (PEFT). Why did LoRA become dominant?

**Answer:** Full fine-tuning of a large model updates every weight and must store optimizer state (momentum + variance) for all of them — for a 70B model that's hundreds of GB of GPU memory, out of reach for most. PEFT methods freeze the pretrained weights and train only a **small number of new parameters**.

**LoRA (Low-Rank Adaptation)** is built on the observation that the *update* a task needs is low-rank. It **freezes the original weight `W`** and learns two small matrices `A` (d×r) and `B` (r×d) whose product is the update: the effective weight becomes `W + BA` with rank `r ≪ d` (typically r = 8–64). Only those matrices train — roughly **0.1–1% of the parameters** — yet quality is close to full fine-tuning on many tasks.

**QLoRA** goes further for memory: it **quantizes the frozen base model to 4-bit** (NF4) and trains full-precision LoRA adapters on top, letting you fine-tune a 65–70B model on a **single 48GB GPU**.

**Other PEFT methods:** **adapters** (small bottleneck modules inserted in each layer), **prefix tuning** (learnable vectors prepended to the attention keys/values), and **prompt tuning** (learnable soft-prompt embeddings). 

LoRA won because of practical advantages: it adds **no inference latency** (the adapter can be **merged** back into `W` after training), you can keep many small task-specific adapters and **swap** them over one base model, and it has broad ecosystem/tooling support. It's been the default way to customize LLMs since 2023.

**Key points:**
- Trains a low-rank delta instead of full weights.
- QLoRA: 4-bit base + LoRA = consumer-GPU fine-tuning.
- Adapters mergeable into base for zero-cost inference.
- Default for LLM customization since 2023.

---

### 27. RLHF: reinforcement learning from human feedback

**Frequency:** High

**Question:** Walk through the RLHF pipeline. Why did DPO emerge as a simpler alternative?

**Answer:** RLHF (Reinforcement Learning from Human Feedback) is the **post-training** process that turns a raw pretrained LLM into a helpful, aligned assistant. It has three stages:

1. **Supervised fine-tuning (SFT)** — fine-tune the base model on a curated set of high-quality instruction → response **demonstrations**, teaching it the format and behavior of following instructions.
2. **Reward model (RM)** — collect prompts with **multiple** candidate responses and have humans **rank** them. Train a separate model to predict these preferences, typically with the **Bradley-Terry** objective (the probability a response is preferred is a logistic function of the reward difference). The RM turns fuzzy human judgment into a scalar score.
3. **PPO (RL) optimization** — fine-tune the SFT model with reinforcement learning to **maximize the reward model's score**, while adding a **KL-divergence penalty** that keeps the policy from drifting too far from the SFT model. That penalty is crucial: without it the model **reward-hacks** (exploits quirks of the RM) and its outputs **collapse** in diversity.

**Strengths:** it aligns **subjective qualities** — helpfulness, harmlessness, tone — that are hard to capture with hand-written examples or a fixed loss. It's how GPT-3.5/4, Claude, and Gemini were aligned.

**Weaknesses:** the pipeline is **complex and unstable** (training and serving a separate RM, tuning PPO), and it's prone to **reward hacking**, **mode collapse**, and **sycophancy** (telling users what they want to hear because raters rewarded it).

**DPO (Direct Preference Optimization)** emerged to simplify this: it derives a loss that trains directly on the preference pairs, **skipping the explicit reward model and RL loop** entirely. It's more stable and easier to run at comparable quality, which is why DPO and its successors (IPO, KTO, ORPO) are now common.

**Key points:**
- SFT → reward model → PPO.
- KL penalty controls distribution drift.
- Aligns subjective qualities beyond demonstrations.
- Complex; DPO is the modern simpler alternative.

---

### 28. Hallucination in LLMs

**Frequency:** High

**Question:** What causes hallucination in LLMs, and how do you mitigate it?

**Answer:** Hallucination is when an LLM produces **confident, fluent text that is factually wrong or entirely invented** — fabricated citations, made-up statistics, plausible-looking but nonexistent APIs. The danger is precisely that it *sounds* authoritative, so it slips past casual review.

**Root causes:**
- *Training objective* — the model is trained to predict the **most plausible** next token, not the most *true* one. Fluency and factuality are different targets.
- *Interpolation over gaps* — where the model lacks knowledge, it fills the space by blending patterns it has seen, producing something that pattern-matches truth without being true.
- *Data errors* — the pretraining corpus itself contains mistakes and contradictions.
- *Instruction-tuning bias* — models are rewarded for being helpful and answering, which nudges them to guess rather than say "I don't know."

**Mitigations:**
- **Retrieval-augmented generation (RAG)** — ground answers in retrieved source documents so the model quotes rather than recalls; the single biggest lever.
- **Citation/attribution prompting** — require the model to cite sources, making unsupported claims visible.
- **Constrained/structured decoding** — force outputs into schemas or valid grammars.
- **Chain-of-thought + verification** and **self-consistency** (sample several answers, take the majority) reduce reasoning errors.
- **Abstention training** — teach the model to say "I don't know," and use **uncertainty signals** (token logprobs, semantic entropy) to flag low-confidence answers.
- **Post-hoc fact-checkers** — an LLM-as-judge or retrieval check on the output.

Frontier models hallucinate less but never zero, especially on niche topics, recent events, and adversarial prompts — so **hallucination resistance should be a first-class evaluation metric**, tracked alongside reasoning and instruction-following, not an afterthought.

**Key points:**
- Confident plausible-but-wrong outputs.
- RAG and citations are top mitigations.
- Self-consistency and abstention help.
- Evaluate hallucination as a first-class metric.

---

### 29. Retrieval-augmented generation (RAG)

**Frequency:** High

**Question:** Explain RAG: the pipeline, its advantages over fine-tuning, and its failure modes.

**Answer:** Retrieval-Augmented Generation answers a query by **fetching relevant documents at query time and injecting them into the prompt** as context, so the model reasons over supplied facts instead of only its frozen parametric memory. This lets it answer over **private, up-to-date, or very large** corpora without retraining.

**The pipeline has two phases:**
- *Indexing (offline)* — **chunk** documents into passages, **embed** each chunk into a vector, and store them in a **vector database** (FAISS, Pinecone, pgvector, Weaviate).
- *Query (online)* — **embed the query**, **retrieve top-k** nearest chunks by vector similarity (often combined with keyword/BM25 for **hybrid search**), optionally **rerank** with a cross-encoder for precision, **assemble** the chunks into the prompt, and **generate** an answer with **citations** back to the sources.

**Versus fine-tuning:** RAG is the right tool for **facts and freshness** — update the knowledge base and the answers change immediately, with built-in **attribution** you can verify. Fine-tuning is better for baking in **style, format, or skills**. They're complementary, and most production "LLM apps" are RAG.

**Common failure modes:**
- *Retrieval misses* — the right chunk isn't in the top-k, so the model has nothing to ground on.
- *Bad chunk boundaries* — splitting mid-idea severs the context needed to answer.
- *Irrelevant retrievals* — off-topic chunks distract or mislead the model.
- *Prompt injection* — malicious instructions embedded in retrieved content hijack the model.

The practical lesson: **retrieval quality usually matters more than which LLM you pick** — invest in chunking, embeddings, hybrid search, and reranking first.

**Key points:**
- Retrieval grounds generation in external sources.
- Pipeline: chunk → embed → retrieve → rerank → generate.
- Better than fine-tuning for facts/freshness.
- Retrieval quality usually the bottleneck.

---

### 30. Agents and tool use

**Frequency:** High

**Question:** What are LLM agents and tool use? What are the main patterns and production challenges?

**Answer:** An **agent** goes beyond single-shot generation by running a **loop**: reason about the goal, take an action (call a tool), observe the result, and decide the next step — repeating until done. Tools give the model capabilities it lacks natively: web search for fresh facts, a code interpreter for exact computation, database or API calls for real actions.

**Main patterns:**
- **ReAct** — interleave explicit **reasoning** traces with **actions**, so the model "thinks out loud" then acts on that thought.
- **Function/tool calling** — the model emits **structured JSON** naming a tool and arguments; the runtime executes it and feeds the result back. This is the standard interface exposed by GPT, Claude, and Gemini.
- **Plan-and-execute** — a planner drafts a multi-step plan up front, then an executor runs the steps (better for complex tasks than deciding one step at a time).
- **Reflection** — the model critiques its own output and revises.
- **Multi-agent** — specialized agents (researcher, coder, reviewer) collaborate; frameworks like AutoGen and CrewAI orchestrate this.

Frameworks (LangChain, LlamaIndex, OpenAI Assistants) provide the orchestration, tool registries, and memory around these loops.

**Production challenges:**
- *Latency* — each step is a round-trip; multi-step traces are slow.
- *Cost* — long reasoning traces and repeated context burn tokens.
- *Reliability* — agents can loop, get stuck, or misuse tools; you need step limits and error handling.
- *Evaluation* — grading a multi-step trace is far harder than scoring a single answer.
- *Safety* — tools that act on the world (send email, run code, spend money) need guardrails and confirmation.

Agents shine when the **right next step genuinely depends on previous results**; for fixed workflows, a single-shot call or a hard-coded pipeline is cheaper and more reliable.

**Key points:**
- Reason → call tool → observe → repeat.
- Function calling is the standard interface.
- Latency, cost, eval are practical challenges.
- Multi-step adaptive > single-shot for many tasks.

---

### 31. Model monitoring and drift detection

**Frequency:** High

**Question:** How do you monitor models in production and detect drift?

**Answer:** A deployed model can **silently degrade** as the world shifts away from its training distribution — accuracy falls with no error, no crash, no alert unless you're watching. Monitoring catches this.

**Four distinct kinds of drift:**
- *Data (covariate) drift* — the input feature distributions move (e.g. a new user demographic). `P(X)` changes.
- *Concept drift* — the relationship between inputs and target changes (fraud tactics evolve, so the same features now mean something different). `P(y|X)` changes — the most dangerous kind.
- *Prediction drift* — the model's **output** distribution shifts, a useful proxy when you don't yet have labels.
- *Performance drift* — the actual accuracy/AUC drops, measurable only once **ground-truth labels arrive** (often with delay).

**Detection methods:** **PSI** (population stability index) and **KL divergence** for distributional shift, the **Kolmogorov-Smirnov** test for continuous features, **ADWIN** for streaming data, and **embedding drift** for images/text (compare embedding distributions).

**Practices that matter:**
- Track drift **per-feature and per-segment**, not just globally — a regression in one country or device type averages out in the global metric but hurts real users.
- Set alerts with **hysteresis** (require sustained deviation) to avoid noisy false alarms.
- Also monitor operational health: **latency, error rate, throughput**.

Tools: Evidently, Arize, WhyLabs, Fiddler, Datadog ML. Crucially, **drift detection without a response plan is just an alarm** — pair it with automated retraining triggers or a human review/triage workflow so detection actually leads to a fix.

**Key points:**
- Data, concept, prediction, performance drift differ.
- PSI/KL for distributional shift.
- Per-segment monitoring catches localized regressions.
- Pair detection with retraining or human triage.

---

### 32. Cross-validation strategies

**Frequency:** Medium

**Question:** Compare the major cross-validation strategies. When is each appropriate?

**Answer:** Cross-validation estimates how a model **generalizes** by rotating which data is held out, giving a more stable, less lucky estimate than a single train/test split. The trick is choosing a scheme that respects your data's **dependency structure** — the wrong one leaks information and inflates the score.

**The core schemes:**
- **k-fold** — split into k equal parts; train on k−1, validate on the held-out fold, and average the k scores. k=5 or 10 is standard. Uses all data for both training and validation.
- **Stratified k-fold** — same, but each fold preserves the **class proportions**. This is the **default for classification**, and essential when classes are imbalanced (otherwise a fold might contain almost no minority examples).
- **Leave-one-out (LOO)** — k = n, holding out a single sample each time. Nearly unbiased but **high variance and expensive**; only for very small datasets.
- **Repeated k-fold** — run k-fold several times with different random splits and average, to stabilize the estimate.

**When simple k-fold is wrong:**
- **Nested CV** — when you *also* tune hyperparameters, an **inner** loop selects them and an **outer** loop evaluates. Tuning and evaluating on the same folds gives an **optimistically biased** score; nesting fixes that.
- **Time series (TimeSeriesSplit)** — you must **never train on the future**. Use forward-chaining with an expanding or sliding window, always validating on later timestamps than training.
- **Grouped / clustered data (GroupKFold)** — when rows share a group (multiple visits per patient, multiple photos per user), keep a whole group entirely in train **or** validation. Splitting a group across both **leaks** identity-specific signal.

Rule of thumb: match the fold structure to how the data is actually correlated, and to the question you're really asking.

**Key points:**
- Stratified k-fold is the safe default for classification.
- Nested CV for honest hyperparameter selection.
- Time series needs forward-chaining splits.
- Group-aware folds avoid leakage in clustered data.

---

### 33. Loss functions: when to use which

**Frequency:** Medium

**Question:** How do you choose a loss function for different tasks?

**Answer:** The loss defines *what "wrong" means* to the optimizer, so it must **match both the output type and the cost of different mistakes**. Two rules never break: don't use a regression loss for classification, or vice versa.

**Regression losses** differ mainly in **outlier sensitivity**:
- **MSE (L2)** squares the error, so large mistakes dominate the gradient — great when big errors are truly bad, but **outliers can hijack training**.
- **MAE (L1)** is linear, so it's **robust to outliers** but has a constant gradient that's harder to optimize near the minimum.
- **Huber** blends them: quadratic for small residuals (smooth), linear for large ones (robust) — a good default when outliers exist but you still want smooth gradients.

**Classification losses:**
- **Binary/categorical cross-entropy (log loss)** is the standard for probabilistic outputs (with **softmax** for multi-class). Crucially, minimizing log loss yields **well-calibrated probabilities** — the predicted 0.7 really means ~70%.
- **Hinge loss** (SVM-style) maximizes the margin but produces **scores, not calibrated probabilities**.

**Specialized losses:**
- **Focal loss** — down-weights easy, well-classified examples so training focuses on hard ones; the go-to for **extreme imbalance** (dense object detection).
- **Ranking** — pairwise (RankNet) or listwise (LambdaRank, ListNet) when relative order matters more than absolute score.
- **Embeddings** — contrastive, triplet, or InfoNCE losses pull similar items together and push dissimilar ones apart.
- **Detection** — combinations like focal + IoU/GIoU for classification-plus-localization.

Always trace the loss back to the **business cost** of errors: if false negatives cost 10× false positives, weight the loss accordingly rather than optimizing raw accuracy.

**Key points:**
- Match loss to output type and error cost.
- Cross-entropy calibrates probabilities; hinge doesn't.
- Huber/MAE for outlier-heavy regression.
- Focal loss for extreme class imbalance.

---

### 34. ROC vs PR curves: when to use which

**Frequency:** Medium

**Question:** Compare ROC and PR curves. When should you use each?

**Answer:** Both curves summarize a classifier's performance **across all thresholds**, but they answer different questions and behave very differently under class imbalance.

**ROC curve** plots **true positive rate** (recall) against **false positive rate** as the threshold sweeps from 0 to 1; **ROC-AUC** is the area under it and equals the probability the model ranks a random positive above a random negative. Its key property: because FPR is normalized by the number of *negatives*, ROC-AUC is **invariant to class balance** — the same score whether positives are 50% or 0.1% of the data.

**PR curve** plots **precision** against **recall**. Precision depends on the number of *predicted* positives, so PR-AUC is **sensitive to the positive rate** — it directly reflects how rare the positive class is.

**Why this matters under heavy imbalance:** suppose 0.1% of transactions are fraud. A model can score **ROC-AUC 0.95** and still be useless, because even a tiny FPR over a huge negative pool produces a flood of false alarms — so **precision at usable recall is terrible**. The PR curve **exposes** this immediately; the ROC curve hides it.

**So:**
- Use **ROC-AUC** for roughly **balanced** problems, or when you want a **balance-invariant** metric to compare models across datasets.
- Use **PR-AUC** when **positives are scarce** and precision matters — fraud, disease screening, information retrieval, click prediction.

And remember: both aggregate over *all* thresholds. Deployment still requires **picking one operating threshold** based on the real cost of false positives vs false negatives, then inspecting the **confusion matrix** at that threshold.

**Key points:**
- ROC-AUC is balance-invariant; PR-AUC is not.
- Use PR-AUC when positives are scarce.
- Both summarize threshold choices; one still must be picked.
- Pair with confusion matrix at deployed threshold.

---

### 35. End-to-end modeling for a tabular business problem

**Frequency:** Medium

**Question:** Take a concrete tabular business problem — say customer churn or credit default prediction — and walk me through your full workflow from problem framing to a deployed, monitored model. Where do you actually spend your effort?

**Answer:** The honest answer up front: on a tabular problem, the payoff is in **framing, data/features, and evaluation** — not in exotic models. A well-tuned gradient booster on clean, leakage-free features beats a fancy net almost every time.

**1. Frame the problem around the decision.** "Predict churn" is not a spec. Nail down the prediction window (churn in next 30 days?), the population, and — critically — the **metric tied to the action**. If the business will call the top-N at-risk customers, you care about **precision@k**, not raw accuracy. Define the label carefully and the timestamp at which features are known.

**2. Baselines first.** Start with a trivial heuristic (e.g. "high if no login in 30 days") to set a floor, then a **logistic regression**. Baselines catch data problems early and tell you whether a complex model is even worth it.

**3. The workhorse: gradient boosting.** **XGBoost / LightGBM / CatBoost** are the default for tabular. They handle mixed types, missing values, and nonlinear interactions with little preprocessing. Reach for deep learning only if you have huge data or rich text/sequence features.

**4. Leakage-free features & splits — the highest-value work.** Feature engineering (aggregations, ratios, recency, trends) drives most of the gains. The single biggest failure mode is **leakage**: features computed with future information, or a random split when the problem is temporal. Use a **time-aware split** (train on past, validate on future) whenever there's a time dimension. Verify no target-derived feature sneaks in.

**5. Imbalance & tuning.** For skewed classes use class weights / `scale_pos_weight` rather than blindly oversampling. Tune hyperparameters with cross-validation (Optuna / random search), but don't over-invest — the model is rarely the bottleneck.

**6. Calibration & threshold.** Business decisions need trustworthy probabilities, so **calibrate** (Platt / isotonic) and check a reliability curve. Then pick the **operating threshold** from the cost/benefit of the action, not the default 0.5.

**7. Error analysis.** Slice performance by segment; find where it fails. This surfaces more improvements than another tuning round.

**8. Offline → online → deploy → monitor.** Validate offline, then confirm with an **A/B test** or shadow run — offline lift often shrinks online. Deploy as **batch scoring** (nightly for churn) or **real-time** if the decision is per-request. Then **monitor** feature drift, score distribution, and realized performance, and schedule **retraining**.

**Key points:**
- Effort pays off in framing, leakage-free features, and evaluation — not exotic models; gradient boosting is the tabular workhorse.
- Tie the metric to the decision (e.g. precision@k), start from heuristic + logistic-regression baselines.
- Guard against leakage with time-aware splits; calibrate probabilities and pick the threshold from business cost/benefit.
- Validate offline then confirm with A/B, deploy batch or real-time, and monitor drift with scheduled retraining.

---

### 36. Designing the right metric and validation for a business problem

**Frequency:** Medium

**Question:** A product team asks you to build a model for a real business problem — say flagging fraudulent transactions. How do you decide what metric to optimize and how to validate it before trusting it?

**Answer:** Metrics aren't chosen from a textbook — they're **derived from the decision and its cost.** Start there.

**1. Start from the decision and the cost of errors.** Ask: what action does a prediction trigger, and what does each mistake cost? For fraud, a **false negative** (missed fraud) costs the chargeback amount; a **false positive** (blocking a legit purchase) costs a frustrated customer and lost revenue. These costs are asymmetric and usually unequal, which immediately rules out plain accuracy — with 0.5% fraud, a model predicting "never fraud" is 99.5% accurate and useless.

**2. Choose a metric that reflects that cost.**
- *Imbalanced classification:* **PR-AUC** and **precision/recall at an operating point**, not ROC-AUC (which flatters on rare positives). Use **F-beta** to weight recall over precision (or vice versa) per the cost ratio.
- *Ranking / recommendation:* **NDCG, MAP, recall@k** — the user only sees the top of the list.
- *Probabilities feeding a decision or price:* **calibration** (reliability curve, Brier, ECE) matters as much as discrimination — a "0.9" must mean 90%.
- *Regression:* match the loss to cost — MAE if errors scale linearly, quantile loss if over/under-prediction differ.

**3. Beware Goodhart / proxy divergence.** The metric is a **proxy** for the business goal; optimizing it hard can diverge from it. Blocking everything maximizes fraud recall but destroys revenue. Guard against this with **guardrail metrics** — secondary constraints (approval rate, latency, customer complaints) that must not regress while you optimize the primary metric.

**4. Design validation that mirrors production.** The split must reflect how the model will actually be used:
- **Time-based split** for any temporal problem — train on the past, validate on the future; never shuffle across time.
- **Group-aware split** so the same user/merchant isn't in both train and test (prevents leakage).
- **Stratify** to preserve the rare-class ratio in every fold.

**5. Align offline to online and pick a threshold.** Confirm the offline metric moves with the business KPI, then choose the **operating threshold** from the cost curve (or a precision/recall target), not the default 0.5. Finally, validate the whole chain with an **online A/B test** measuring the actual business outcome.

**Key points:**
- Derive the metric from the decision and the asymmetric cost of FP vs FN — accuracy is usually wrong for imbalance.
- Match the metric to task: PR-AUC/F-beta for imbalance, NDCG for ranking, calibration when probabilities drive decisions.
- Use validation that mirrors production: time-aware, group-aware, stratified splits.
- Add guardrail metrics against Goodhart, tune the operating threshold from cost, and confirm with an A/B test.

---

### 37. The ML project lifecycle

**Frequency:** Medium

**Question:** Walk through the ML project lifecycle. Where do most projects actually fail?

**Answer:** An ML project is a loop, not a straight line, and the modeling is the *cheap* part. The stages:

1. **Problem framing & metric design** — What **decision** does the model improve? What **metric** captures success, and what's the **baseline** (often a simple heuristic) to beat? Getting this wrong dooms everything downstream.
2. **Data collection & labeling** — gather, clean, and label data; establish label quality and consistency.
3. **Exploratory data analysis (EDA)** — understand distributions, missingness, leakage risks, and segment behavior.
4. **Feature engineering & splits** — build features and create **leakage-free** train/val/test splits that mirror production.
5. **Baseline model** — the simplest thing that works, to set a floor and validate the pipeline end-to-end.
6. **Iterative modeling** — improve with proper validation, guided by **error analysis** (looking at *which* cases fail and why, not just the aggregate score).
7. **Calibration & threshold tuning** — turn scores into decisions at the right operating point.
8. **Offline evaluation** on a held-out set that resembles production.
9. **Online A/B test** against the current production system — the only test that really counts.
10. **Monitoring** — data drift, performance, fairness — plus a **retraining cadence**, and eventually **deprecation**.

**Where projects actually fail is almost always upstream:** the wrong problem was framed, the data **leaks** (inflating offline metrics), offline and online metrics are **mismatched**, or there's **no monitoring** so silent decay goes unnoticed. The lesson: spend most of your time on **data quality and evaluation**, not on chasing a 0.5% AUC bump — a well-framed problem with clean data and honest evaluation beats a fancy algorithm on a shaky foundation.

**Key points:**
- Problem framing and metric design dominate outcomes.
- Online > offline; A/B test before trusting any model.
- Monitoring and retraining are part of the lifecycle.
- Data quality beats fancy algorithms.

---

### 38. Support vector machines

**Frequency:** Medium

**Question:** How do support vector machines work, and what are their limitations?

**Answer:** An SVM finds the hyperplane that **maximizes the margin** — the distance between the decision boundary and the nearest points of each class. That maximum-margin choice tends to generalize well, and only the closest points, the **support vectors**, actually determine the boundary; everything farther away is irrelevant to the solution.

**Two key mechanisms:**
- **Soft margin (`C`)** — real data isn't perfectly separable, so `C` trades **margin width against misclassifications**. Small `C` = wider margin, more tolerant of errors (more regularization); large `C` = fits training data harder (risk of overfitting).
- **Kernel trick** — to get **non-linear** boundaries, kernels (RBF, polynomial, linear) compute inner products in a high-dimensional space **implicitly**, without ever materializing the expanded features. This makes complex boundaries tractable and is the SVM's signature idea.

**Where SVMs excel:** **high-dimensional** problems, especially when **features outnumber samples** — the classic case being **text classification with TF-IDF** vectors.

**Limitations:**
- **Scaling** — training is roughly `O(n²)`–`O(n³)`, so they bog down past ~100k samples.
- **Sensitivity** — kernel choice and hyperparameters (`C`, `gamma`) strongly affect results and need careful tuning.
- **No native probabilities** — outputs are signed distances, not calibrated probabilities; you need **Platt scaling** to get them.

SVMs have largely been supplanted by **tree ensembles and neural nets**, but they remain a strong choice on **small, high-dimensional** datasets.

**Key points:**
- Margin maximization with support vectors.
- Kernel trick for non-linear boundaries.
- Doesn't scale past ~100k samples.
- Needs Platt scaling for probabilities.

---

### 39. K-nearest neighbors

**Frequency:** Medium

**Question:** How does k-nearest neighbors work, and what are its main sensitivities?

**Answer:** KNN is a **lazy learner**: there is no training phase in the usual sense \u2014 it simply **stores all the training data**. At prediction time it finds the **k closest training examples** to the query (by a distance metric \u2014 Euclidean, Manhattan, or cosine) and combines their labels: **majority vote** for classification, **average** for regression. All the work happens at inference.

That design flips the usual cost structure: **training is free, but inference is expensive** \u2014 naive lookup is `O(n)` per query because you compare against every stored point. To make it practical you **index** the data: **KD-trees** or **ball trees** for low dimensions, and **approximate nearest neighbor (ANN)** structures like **HNSW or FAISS** for high dimensions and large scale.

**Three sensitivities to watch:**
- **Feature scaling** \u2014 distance is dominated by large-magnitude features, so an unscaled feature can swamp the others. **Always normalize/standardize** first.
- **Curse of dimensionality** \u2014 in high dimensions, distances between points **concentrate** (everything becomes roughly equidistant), so "nearest" loses meaning and KNN degrades.
- **Choice of `k`** \u2014 a classic bias-variance knob: **small `k`** = low bias, high variance (noisy, sensitive to outliers); **large `k`** = smoother but higher bias. Tune it with cross-validation.

For direct classification, learned models have largely replaced KNN. But its core operation \u2014 find the nearest vectors \u2014 is now **essential in retrieval**: embedding-based recommender systems, semantic search, and RAG all rely on ANN search over embeddings, which is KNN at scale.

**Key points:**
- No training; slow inference without index.
- Must scale features; choose k by CV.
- Suffers in high dimensions.
- ANN libraries (FAISS, HNSW) make it scalable for retrieval.

---

### 40. Naive Bayes

**Frequency:** Medium

**Question:** How does Naive Bayes work, and why does it work well for text despite its "naive" assumption?

**Answer:** Naive Bayes classifies by applying **Bayes' theorem** — `P(class | features) ∝ P(class) × P(features | class)` — and picking the class with the highest posterior. The **"naive"** part is the simplifying assumption that all features are **conditionally independent given the class**, which turns the hard joint `P(features | class)` into a simple product of per-feature probabilities.

**Three variants** for different feature types:
- **Gaussian NB** — continuous features, modeled as normal distributions per class.
- **Multinomial NB** — **token counts**; the workhorse for text (spam, sentiment, topic).
- **Bernoulli NB** — binary present/absent features.

**Why it's so fast:** training is **closed-form** — just count and normalize frequencies in a single pass. No iterative optimization, tiny memory, trivial to update.

**Why it works for text despite the assumption being false:** words in a sentence obviously *aren't* independent, yet Naive Bayes classifies well anyway. The reason is that for classification you only need the model to get the **argmax** right, not the exact probabilities — even with wrong independence assumptions, the correct class usually still wins the comparison. High-dimensional bag-of-words data plays to this strength.

**Its main weakness is calibration:** because it multiplies many "independent" probabilities that are actually correlated, it **double-counts evidence** and produces **overconfident** probabilities (pushed toward 0 or 1). So trust its *ranking/label*, not its raw probability.

It's been outperformed by logistic regression and transformer classifiers on serious NLP, but its near-zero cost keeps it an excellent **baseline** for text and small-data problems.

**Key points:**
- Assumes feature independence; rarely true but often works.
- Trains in one pass; extremely fast.
- Probabilities are not well calibrated.
- Best baseline for text and small-data classification.

---

### 41. Learning rate schedules

**Frequency:** Medium

**Question:** Explain learning rate schedules and why they matter.

**Answer:** A **constant** learning rate is rarely optimal because the ideal step size *changes* during training: early on you want **large steps** to move fast across the loss landscape, but near a minimum large steps **overshoot and oscillate**, so you want to **shrink** them. Too high diverges; too low crawls. A schedule varies the LR over time to get the best of both.

**Common schedules:**
- **Step decay** — drop by a factor (e.g. 10×) every N epochs. Simple, effective.
- **Exponential decay** — smooth continuous decrease.
- **Cosine annealing** — follow a cosine curve down to (near) zero; a very popular modern default that spends time at both high and low rates.
- **Cosine with warm restarts (SGDR)** — periodically jump the LR back up to escape sharp minima and explore.
- **Reduce-on-plateau** — drop the LR only when validation loss stalls; robust when you don't know the right schedule in advance.
- **One-cycle (Smith)** — ramp LR *up* then *down* within a single run, often training faster (super-convergence).

**The transformer standard is linear warmup + decay:** ramp the LR **up** linearly over the first ~1–10% of steps, then **cosine or linear decay** down. **Warmup** matters because adaptive optimizers (Adam) haven't yet built reliable variance estimates early on — a big first step on noisy statistics can destabilize or blow up training, so you ease in.

To pick the **peak** LR, use an **LR finder**: sweep the LR upward over a few hundred iterations and plot loss vs LR; choose a value just below where the loss starts diverging. In practice the **schedule can swing final accuracy by several points** — often mattering more than which optimizer you choose.

**Key points:**
- Warmup + cosine is the transformer default.
- LR finder cheaply picks a good peak.
- Reduce-on-plateau is robust for unknown regimes.
- LR schedule choice often matters more than optimizer choice.

---

### 42. Debugging poor answer quality in a RAG/LLM app

**Frequency:** Medium

**Question:** Your RAG chatbot is giving wrong, vague, or hallucinated answers in production. Walk me through how you'd systematically diagnose and fix it.

**Answer:** The mistake is to start randomly swapping models or prompts. A RAG answer flows through three stages — **retrieval → context assembly → generation** — and bad output can originate in any of them. The whole game is **localizing which stage fails** before you touch anything.

**First, make failures observable.** Log the full trace for each query: the rewritten query, the retrieved chunks with scores, the exact assembled prompt, and the final answer. Assemble a small **eval set** (30–100 real failing questions with expected answers). You cannot debug what you can't reproduce.

**Stage 1 — Retrieval (most common culprit).** For a failing query, look at the retrieved chunks: *was the answer even in there?* If the right document wasn't retrieved, generation never had a chance. Check **recall@k** against known-relevant docs. Common fixes, roughly in order of payoff:
- *Chunking* — too-large chunks dilute relevance; too-small ones lose context. Tune size/overlap.
- *Embeddings / query mismatch* — a better embedding model, or **hybrid search** (BM25 + vector) to catch keyword/acronym queries semantics miss.
- *Reranking* — a cross-encoder reranker over the top-50 dramatically sharpens the top-5.
- *Metadata filtering* — wrong tenant/date/version chunks leaking in.

**Stage 2 — Context assembly.** The right chunk was retrieved but the answer is still bad. Verify the chunk **actually made it into the prompt** (token budget truncation is a classic silent bug). Check **ordering**: models suffer "lost in the middle," so put the most relevant chunk first or last, not buried. Check for contradictory or duplicate chunks confusing the model.

**Stage 3 — Generation.** The context is correct and complete, but the model still hallucinates or ignores it. Measure **faithfulness** (does the answer stay grounded in the provided context?) vs **answer relevance**. Fixes: a stronger instruction to answer only from context and say "I don't know" otherwise, lower temperature, or a larger model.

**Use the right tooling.** **RAGAS** or **TruLens** score faithfulness, context precision/recall, and answer relevance automatically over your eval set — this quantifies which stage is weakest instead of eyeballing.

**Change one variable at a time.** Treat it like an experiment: A/B each change against the eval set and keep only what moves the metric. Ranked by frequency, root causes are usually: (1) retrieval misses, (2) chunking too coarse, (3) context truncated/mis-ordered, (4) prompt not enforcing grounding, (5) model too weak.

**Key points:**
- Localize the failing stage — retrieval vs assembly vs generation — before changing anything.
- Retrieval is the most common culprit: check recall@k, chunking, hybrid search, reranking.
- Verify the context is actually in the prompt and ordered to avoid "lost in the middle."
- Use RAGAS/TruLens + a fixed eval set; A/B one variable at a time.

---

### 43. Offline metrics look great but production is worse — how to debug

**Frequency:** High

**Question:** Your model scores excellently offline — say 0.92 AUC on the held-out set — but once deployed, its live performance is clearly worse. How do you diagnose and fix the offline-online gap?

**Answer:** This is one of the most common senior-level failures, and there's a standard suspect list. Diagnose in order of likelihood.

**1. Data leakage (the #1 suspect).** When offline metrics are *suspiciously* good, assume leakage until proven otherwise. A feature encodes the target (e.g. a field populated *after* the event, or an ID correlated with the label), so the model can't reproduce it live. **Diagnose:** ablate top features by importance — if one feature carries the whole model, it's likely leaking. Check each feature's real-world availability *at prediction time*.

**2. Train/serving skew.** Features are computed one way in the offline pipeline (batch SQL, full-window aggregates) and a different way online (streaming, partial windows, different defaults for missing values). The model sees a distribution it never trained on. **Diagnose:** log the exact serving feature vector and re-score it offline; compare against the offline vector for the same entity. **Fix:** a shared **feature store** / single feature-transform code path used by both training and serving.

**3. Wrong evaluation split.** Random splits on temporal or grouped data inflate offline scores via **temporal leakage** (training on the future to predict the past) or **group leakage** (same user in train and test). **Fix:** time-based split; group-aware split so an entity lives in only one fold.

**4. Distribution shift.** Live traffic differs from the training window — new users, seasonality, a UI change, a marketing campaign. **Diagnose:** compare feature distributions (PSI/KL) train vs live; monitor for drift continuously.

**5. Metric/label mismatch.** Your offline metric (AUC, logloss) isn't what the business cares about (revenue, retention, CTR at the served threshold). A model can win on AUC yet lose on the top-k that users actually see. **Fix:** align the offline metric to the online decision and evaluate at the real operating threshold.

**6. Feedback loops & serving constraints.** The deployed model changes the data it later sees (recommendations bias future clicks), or latency budgets force a smaller/quantized model or approximate retrieval that the offline eval never modeled.

**Practical order:** confirm the split is honest → check leakage → replay serving features offline to catch skew → compare distributions → verify the metric maps to the business goal. Always validate with a small **online A/B test**, not offline numbers alone.

**Key points:**
- Suspiciously good offline scores usually mean leakage or a leaky split — check these first.
- Train/serving skew is the most common silent gap; a shared feature store is the fix.
- Use time-aware and group-aware splits that mirror how the model runs in production.
- The offline metric must map to the business decision at the real threshold; confirm with an A/B test.

---

### 44. Designing the ML side of a recommendation/ranking system

**Frequency:** High

**Question:** You're asked to design the machine-learning side of a large-scale recommendation system (say a video feed or an e-commerce homepage) that must pick a handful of items from tens of millions in under ~100ms. Walk me through the architecture, the models, the training data, and how you'd measure success.

**Answer:** The industry-standard answer is a **multi-stage funnel**, because you cannot score 50M items per request. Each stage trades recall for precision and gets more expensive per item.

**Stage 1 — Candidate generation / retrieval.** Cut the corpus from tens of millions to ~hundreds/thousands cheaply. The workhorse is a **two-tower model**: a user tower and an item tower produce embeddings trained so relevant pairs have high dot-product. Item embeddings are precomputed and indexed in an **ANN** store (FAISS, ScaNN, HNSW) so retrieval is a millisecond nearest-neighbor lookup. Run several retrieval sources in parallel — two-tower, recent/trending, collaborative-filtering, "users who watched X", and graph-based — then union the candidates. This ensembling matters more than any single fancy retriever.

**Stage 2 — Ranking.** Now score the few hundred candidates with a heavy model using **rich features**: user features (history, demographics, embeddings), item features (category, age, popularity, creator embeddings), and crucially **cross/context features** (time of day, device, query, user-item interaction counts). Gradient-boosted trees (LightGBM/XGBoost) are a strong baseline; large shops use **deep ranking models** (Wide&Deep, DeepFM, DLRM) to learn feature crosses. Often it's **multi-objective** — predict CTR, watch-time, likes, and completes, then combine via a weighted/learned formula.

**Stage 3 — Re-ranking.** The final policy layer: enforce **diversity** (MMR / avoid 5 items from one creator), inject **freshness/exploration**, apply business rules (ads, promotions, dedup), and blend. This is where product judgment lives.

**Training data & labels.** Use **implicit feedback** (clicks, watches, purchases) since explicit ratings are sparse. Two big traps: **position bias** (top items get clicked because they're on top — correct with inverse-propensity weighting or position features dropped at serving) and **negative sampling** for retrieval (sample non-impressed items; in-batch negatives are standard).

**Evaluation.** Offline: **AUC / logloss** for ranking, **recall@k / NDCG** for retrieval — necessary but weakly correlated with reality. The real judge is an **online A/B test** on engagement/revenue guardrails. Watch **feedback loops**: the model recommends popular items, which get more data, which makes them more recommended — combat with exploration and popularity debiasing.

**Serving.** Precompute item embeddings + ANN index offline; do user-tower embedding + ranking in real time within a strict latency budget. Handle **cold start** with content features and popularity fallbacks for new users/items.

**Key points:**
- Multi-stage funnel (retrieval → ranking → re-ranking) exists to meet the latency budget; each stage trades recall for precision.
- Two-tower + ANN for cheap high-recall retrieval; GBDT or deep model with rich cross features for precise ranking.
- Train on implicit feedback; explicitly handle position bias and negative sampling.
- Offline metrics (AUC/NDCG/recall@k) only screen candidates; online A/B on engagement decides — and watch popularity feedback loops and cold start.

---

### 45. ResNet, EfficientNet, ViT

**Frequency:** Medium

**Question:** Compare ResNet, EfficientNet, and ViT as vision architectures. Cover (1) how ResNet's residual connections enabled deep CNN backbones, (2) how EfficientNet uses neural architecture search plus compound scaling of depth, width, and resolution along with MBConv and SE blocks, and (3) how ViT treats image patches as a token sequence for a standard transformer, requiring large-scale pretraining, plus how hybrids like ConvNeXt fit in and when each is the right default.

**Question:** Compare ResNet, EfficientNet, and ViT as vision architectures. When is each the right default?

**Answer:** These three mark the main eras of image modeling.

**ResNet** made **depth trainable**. Its **residual connections** (`y = F(x) + x`) gave gradients a direct path, so 50/101/152-layer CNNs could actually be optimized. It became the **de facto backbone** for classification, detection, and segmentation, and remains a **strong, reliable default** — especially on **smaller datasets** where its convolutional priors (locality, weight sharing) are an advantage.

**EfficientNet** optimized the **accuracy-per-FLOP** tradeoff. Rather than scaling one dimension, it uses **neural architecture search (NAS)** to design a good base network, then applies **compound scaling** — increasing **depth, width, and input resolution together** in a balanced ratio, which beats scaling any single axis. It's built from **MBConv** (inverted-residual) blocks and **squeeze-and-excitation (SE)** channel attention, making it excellent when **compute/memory budget** is the constraint.

**ViT (Vision Transformer)** discards convolution entirely: it **splits the image into patches**, linearly embeds each as a token, and feeds the sequence to a **standard transformer**. With weak built-in priors it's **data-hungry** — it needs **large-scale pretraining** (JFT-300M) to beat CNNs — but it then **scales beautifully** and captures global relationships from layer one.

**Hybrids like ConvNeXt** take transformer-era design tricks (large kernels, LayerNorm, GELU, fewer activations) back into a pure CNN, matching ViT accuracy with convolutional efficiency.

**Rule of thumb:** ResNet/ConvNeXt for **small-to-medium data** and efficiency; **ViT and successors (Swin, DINOv2)** when you have **scale** — huge datasets or strong pretrained checkpoints.

**Key points:**
- ResNet: residuals enable deep nets.
- EfficientNet: NAS + compound scaling.
- ViT: patches + transformer; needs scale.
- ConvNeXt: modernized CNN competitive with ViT.

---

### 46. Designing a fraud/anomaly detection system end to end

**Frequency:** Medium

**Question:** Design an end-to-end fraud detection system for a payments platform. It has to score transactions in real time, cope with the fact that only ~0.1% are fraud, and keep up with fraudsters who constantly change tactics. How do you build it?

**Answer:** Fraud detection is defined by three hard constraints: **extreme class imbalance**, **delayed/noisy labels**, and an **adversary that adapts**. Every design choice flows from these.

**Data & labels.** Fraud is often <0.1% of transactions, and labels arrive late — a chargeback may confirm fraud weeks later, so recent "good" transactions are really *unlabeled*. Handle imbalance with class weights or focal loss rather than naive oversampling; SMOTE rarely helps on real tabular fraud. Account for label delay by training on windows old enough to be "matured."

**Features are where you win.** The signal lives in **velocity / aggregation features**: transactions per card per hour, amount vs the user's 30-day average, distinct merchants/devices in the last day. Add **behavioral/device** signals (device fingerprint, IP, typing/session behavior) and **graph features** (cards sharing a device, shared shipping address, rings of accounts) — fraud is relational.

**Two-stage architecture.** Stage 1: a **cheap, high-recall filter** (simple rules + a light model) that clears the ~99% obviously-legit traffic in a couple milliseconds. Stage 2: a **precise model** (gradient boosting — XGBoost/LightGBM — is the workhorse) plus a **rules engine** for known patterns and hard compliance constraints. Rules and ML coexist: rules give instant, explainable coverage for known fraud; ML catches the rest.

**Thresholding is a business decision.** Don't optimize accuracy (99.9% by predicting "never fraud"). Use **PR-AUC**, and pick the operating threshold from the **cost matrix**: a blocked legitimate customer (false positive) has a real revenue/CX cost, a missed fraud (false negative) a direct loss. Often you output a score band → auto-approve / auto-decline / **send to human review**.

**Human-in-the-loop.** A case-management queue lets analysts review borderline cases; their decisions become fresh labels, closing the loop. Prioritize the queue by score × amount.

**Adversarial drift.** Fraudsters probe and adapt, so **concept drift** is constant — retrain frequently (daily/weekly), monitor score distributions and precision at fixed thresholds, and alert on drift. Pair the supervised model with **unsupervised anomaly detection** (isolation forest, autoencoders) to flag *novel* fraud patterns the labeled model has never seen.

**Explainability & serving.** Analysts and regulators need reasons, so use SHAP/reason codes on each alert. Serve behind a low-latency feature store so aggregation features are consistent between training and real-time scoring (avoid train/serve skew).

**Key points:**
- Design is driven by extreme imbalance, delayed/noisy labels, and an adaptive adversary — not by picking a fancy model.
- Velocity/aggregation, behavioral/device, and graph features carry the signal; a feature store keeps train and serve consistent.
- Two-stage (cheap high-recall filter → precise model + rules engine) meets latency; supervised + unsupervised catches novel fraud.
- Tune thresholds via cost matrix / PR-AUC, route borderline cases to human review, and retrain often with drift monitoring and SHAP explanations.

---

### 47. Controlling cost and latency in an LLM application

**Frequency:** High

**Question:** Your LLM feature works but is too slow and too expensive at scale. What levers do you pull, and how do you decide which ones?

**Answer:** Start by **measuring before optimizing**. Track cost per request, tokens in/out, and latency as p50/p95/p99 (tails matter for UX and SLOs). Separate the two failure modes — a slow p99 is a different problem from a high average bill — and attribute cost to input vs output tokens, since output is usually far pricier.

**Model tiering / routing** is the biggest lever. Send easy queries to a small/cheap model and escalate only hard ones to a frontier model — a classifier or confidence check picks the tier. This alone can cut cost 5-10x because most traffic is easy. Distilling a small task-specific model for the common path pushes it further.

**Shrink the tokens.** Output length caps (`max_tokens`) and instructions to be concise directly cut the expensive side. Trim prompts and few-shot examples; use RAG to inject only relevant chunks instead of stuffing whole documents into context. Fewer input tokens = lower cost *and* lower latency.

**Caching.** Prompt caching (reusing a static system prompt / long context across calls) can cut both cost and time-to-first-token dramatically for repeated prefixes. Semantic caching stores answers to near-duplicate queries (embed the query, return the cached response on a hit) — great for FAQ-like traffic.

**Perceived vs actual latency.** Streaming tokens makes time-to-first-token the number users feel, even if total generation is unchanged — cheap and high-impact for UX.

**Serving efficiency (self-hosted).** Use an optimized server like vLLM for continuous batching and PagedAttention (KV-cache efficiency), quantize weights (INT8/FP8/4-bit) to fit more throughput per GPU, and consider speculative decoding to speed generation. Batching raises throughput at the cost of some per-request latency.

**Tradeoffs and SLOs.** Every lever trades against quality: smaller models, aggressive trimming, and quantization can degrade answers, so gate changes with an eval set. Set explicit SLOs (e.g. p95 < 2s, cost < $X / 1k requests) and optimize toward them rather than chasing zero. Common pitfalls: optimizing average while p99 users churn; caching stale answers where freshness matters; over-quantizing and silently losing quality.

A practical order: cap outputs and trim prompts (free) → add caching → add routing/tiering → then invest in serving-level optimizations if self-hosting.

**Key points:**
- Measure first: cost/request, tokens, and p50/p95/p99 — output tokens dominate cost.
- Model tiering/routing (small model + escalate) is usually the biggest win.
- Cut tokens (max_tokens, RAG, trimmed prompts) and cache (prompt + semantic).
- Stream for perceived latency; vLLM/quantization/speculative decoding for self-hosted throughput; gate every change against quality and SLOs.

---

### 48. Multi-head attention

**Frequency:** Medium

**Question:** Explain multi-head attention and the MQA/GQA efficiency variants.

**Answer:** Instead of computing attention once over the full `d_model` dimension, multi-head attention **projects Q, K, and V into `h` lower-dimensional subspaces** (heads), runs **scaled dot-product attention independently in each**, then **concatenates** the results and projects back to `d_model`. Total parameters are comparable to single-head attention of the same width, but expressivity is higher.

**Why multiple heads help:** each head can **attend to a different pattern in a different subspace simultaneously** — one head might track syntactic dependencies, another coreference, another local position, another semantic similarity. A single head would have to average all these roles into one attention distribution; splitting them lets the model capture several relationships at once. (The typical count is `d_model / 64` heads.)

**The inference bottleneck they create:** during autoregressive generation you **cache the keys and values** of all past tokens (the **KV cache**). With many heads and long contexts this cache becomes the dominant memory cost and bandwidth bottleneck. Two variants shrink it:
- **Multi-Query Attention (MQA)** — keep separate query heads but let **all heads share a single K/V**. Drastically cuts KV-cache size, at a small quality cost.
- **Grouped-Query Attention (GQA)** — the **middle ground**: partition heads into a few **groups**, each group sharing one K/V. It recovers most of MQA's memory savings with near-full quality, which is why **LLaMA-2/3 and Mistral** use it.

A further observation: **many heads are redundant** — studies show a large fraction can be **pruned** after training with little accuracy loss.

**Key points:**
- Parallel heads over different subspaces.
- Heads often specialize interpretably.
- MQA/GQA reduce KV cache for long-context inference.
- Pruning shows many heads are redundant.

---

### 49. Positional encoding: sinusoidal, learned, RoPE, ALiBi

**Frequency:** Medium

**Question:** Why does attention need positional encoding? Compare sinusoidal, learned, RoPE, and ALiBi.

**Answer:** Self-attention is **permutation-invariant** — it computes weighted sums over all tokens with no inherent notion of order, so "dog bites man" and "man bites dog" would look identical. Positional encoding **injects order information** so the model knows where each token sits.

**The four main schemes:**
- **Sinusoidal** (original Transformer) — add fixed vectors made of sine/cosine waves at geometrically varying frequencies. Deterministic, needs no training, and in principle extends to unseen lengths.
- **Learned embeddings** (BERT, GPT-2) — a trainable vector per position. Works just as well *within* the trained range, but has a hard limit: it **cannot generalize beyond the maximum length seen in training** because positions past that have no learned vector. Both of these add **absolute** position to the input.
- **RoPE (Rotary Position Embedding)** — instead of adding to inputs, it **rotates the Q and K vectors by an angle proportional to their position**. Because attention depends on the dot product of Q and K, this makes the attention score depend on the **relative** offset between tokens (rotation difference), which is what actually matters linguistically. It generalizes better and is now **standard in LLaMA, Mistral, Qwen**.
- **ALiBi** — adds a **linear bias** to attention scores that penalizes attending to distant tokens, with no positional embedding at all. Simple, and **extrapolates well** to sequences longer than training.

**Long-context extension:** a model pretrained with RoPE at, say, 4k tokens can be stretched to much longer contexts by **scaling/interpolating** the rotary frequencies — **NTK-aware scaling** and **YaRN** are the common techniques, letting you extend context without full retraining.

**Key points:**
- Attention needs explicit position signal.
- RoPE dominates modern LLMs.
- ALiBi extrapolates well to longer sequences.
- YaRN/NTK scaling stretch RoPE for long context.

---

### 50. BERT vs GPT vs T5

**Frequency:** Medium

**Question:** Compare BERT, GPT, and T5. Why did decoder-only models win the scaling race?

**Answer:** The three represent the **three transformer topologies**, each with a matching pretraining objective:

- **BERT — encoder-only, bidirectional.** Pretrained with **masked language modeling** (predict randomly hidden tokens using context from *both* sides) plus next-sentence prediction. Because it sees the full context at once, it builds rich **understanding** representations — fine-tune it for classification, NER, or extractive QA. It is **not designed to generate** text.
- **GPT — decoder-only, autoregressive.** Pretrained on **next-token prediction** with a **causal mask** (each token sees only the past). Generation is native, and this objective scales into general-purpose assistants.
- **T5 — encoder-decoder, text-to-text.** Casts **every task as text→text** ("translate: ...", "summarize: ..."), pretrained by masking and reconstructing spans. Flexible across translation, summarization, and classification-as-generation.

**Why decoder-only won at scale:** a single **next-token objective** on raw text is the simplest thing to scale to trillions of tokens, and it unlocked **in-context learning** — the ability to learn a task from examples in the prompt with **no fine-tuning**. That emergent flexibility, plus training efficiency, is why nearly all frontier foundation models (GPT-4, Claude, LLaMA, Mistral) are decoder-only.

**But the others keep their niches:** the **BERT family still rules cheap, high-throughput classification and embeddings**, where bidirectional understanding at low cost beats a giant generative model. **Encoder-decoder** models (T5, BART, FLAN-T5) remain strong for **fine-tuned seq2seq** tasks like translation at modest scale.

**Key points:**
- BERT = understand; GPT = generate; T5 = both.
- Decoder-only won the scaling race.
- BERT-family still rules cheap classification/embeddings.
- T5 popular for fine-tuning text-to-text tasks.

---

### 51. GANs

**Frequency:** Medium

**Question:** How do GANs work, and what are their classic failure modes?

**Answer:** A GAN pits two networks against each other in a **min-max game**. The **generator `G`** maps random noise `z` to synthetic data; the **discriminator `D`** tries to tell real samples from generated ones. They train adversarially: `D` maximizes its accuracy at spotting fakes, while `G` minimizes it by producing samples realistic enough to fool `D` — learning via gradients that flow *through* `D`. At the theoretical equilibrium, `G` reproduces the true data distribution and `D` can't do better than chance.

**In practice it's notoriously hard to train:**
- **Mode collapse** — `G` discovers a few outputs that reliably fool `D` and produces only those, **ignoring large parts of the distribution** (e.g. generating one face repeatedly).
- **Training instability** — the two networks must stay **balanced**; if `D` gets too strong, `G`'s gradients vanish; oscillation and divergence are common.
- **No principled likelihood** — you can't directly measure how well `G` fits the data, making evaluation and model selection awkward.
- **Hyperparameter fragility** — results swing wildly with architecture and learning-rate choices.

**Major variants** addressed these: **DCGAN** (stable CNN backbone), **WGAN/WGAN-GP** (Earth-Mover distance for far more stable training), **StyleGAN** (style-based generator, long the SOTA for photorealistic faces), **conditional GANs** (class- or text-guided generation), and **CycleGAN** (unpaired image-to-image translation).

**Why diffusion supplanted them (since 2022):** diffusion trains stably with a simple regression loss and gives **better distribution coverage** and diversity, avoiding mode collapse. GANs retain one advantage — **single-forward-pass inference**, so they're much **faster to sample** than iterative diffusion.

**Key points:**
- Adversarial min-max game.
- Mode collapse and instability are classic failures.
- StyleGAN family long held SOTA for faces.
- Diffusion mostly replaced GANs since 2022.

---

### 52. Building a reliable LLM structured-extraction pipeline

**Frequency:** Medium

**Question:** You need to turn a stream of unstructured documents (invoices, resumes, contracts) into clean structured JSON records at scale. How do you design an LLM extraction pipeline that is reliable enough to feed downstream systems?

**Answer:** The core problem is that a raw LLM prompt returns plausible-looking prose, not a guaranteed-valid record. Treat the LLM as one stage in an ETL pipeline wrapped in validation, retries, and monitoring — not as the whole solution.

**Start from the schema, not the prompt.** Define the target as an explicit typed schema (Pydantic model or JSON Schema): field names, types, enums, required vs optional, formats (ISO dates, currency codes). The schema is the contract everything else enforces. Ship it in the prompt so the model knows the shape, and use it again for validation.

**Constrain the output instead of hoping.** Prefer **function/tool calling** or a provider "strict"/JSON mode so the model emits schema-conformant JSON directly. Libraries like **Instructor** (Pydantic-backed) or **Outlines** (grammar-constrained decoding) make malformed JSON structurally impossible rather than merely discouraged. This removes an entire class of parse errors up front.

**Validate then retry.** Parse and validate every response against the schema. On failure, run a bounded **retry-on-error loop** (2–3 attempts) that feeds the validation error back into the prompt ("field `amount` must be a number, you returned '$1,200'"). Most transient errors self-correct on the second pass. After N failures, route to a dead-letter queue.

**Handle long documents.** A 40-page contract won't fit cleanly in context or attention. **Chunk** it, extract per chunk, then **merge** (map-reduce): reconcile duplicates, take the highest-confidence value per field, and keep provenance (which chunk/page a field came from) for auditing.

**Fight hallucinated and missing fields.** Instruct the model to emit `null` rather than guess, and ask for a per-field **confidence** or a supporting quote/span from the source. Fields with no grounding span are treated as suspect.

**Human-in-the-loop by confidence.** Auto-accept high-confidence records; route low-confidence ones (or those below a validation threshold) to a review UI. This lets you hit high overall accuracy without a human touching every record.

**Normalize in post-processing.** Deterministic code — not the LLM — should canonicalize dates, currencies, phone numbers, and dedupe. Keep the LLM's job narrow.

**Evaluate at field level.** Build a labeled gold set and measure **per-field precision/recall/F1**, not a single "looks right" score. This tells you which fields to fix and gates prompt/model changes.

**Control cost.** Run a cheap model (e.g. a small/mini tier) by default and **escalate** only records that fail validation or fall below a confidence threshold to a stronger model.

**Key points:**
- Schema is the contract: constrained decoding + validation, not free-text parsing.
- Bounded retry loop that feeds validation errors back fixes most failures.
- Chunk-extract-merge for long docs; confidence gating routes to human review.
- Field-level precision/recall on a gold set; cheap-model-first with escalation for cost.

---

### 53. Diffusion models

**Frequency:** Medium

**Question:** How do diffusion models work, and why did they overtake GANs?

**Answer:** Diffusion models generate data by **learning to reverse a gradual noising process**.

**Forward process** (fixed, no learning): take a real image and add a small amount of **Gaussian noise** repeatedly over `T` steps until it becomes **pure noise**. This defines a sequence from clean data to noise.

**Reverse process** (learned): train a network — historically a **U-Net**, now often a **DiT** (diffusion transformer) — to **predict the noise** added at each step. To generate, start from random noise and **iteratively denoise**: predict the noise, subtract a bit of it, repeat, walking backward from noise to a clean sample.

**Training is remarkably simple:** pick a random image, a random timestep, add the corresponding noise, and train the network to predict that noise with a plain **MSE loss** (Ho et al., DDPM). No adversarial game, which is exactly why it's **stable**.

**Making it practical:**
- **Faster sampling** — naive sampling needs hundreds of steps; **DDIM, DPM-Solver** cut this to 10–50 steps.
- **Latent diffusion (Stable Diffusion)** — run the whole process in a **VAE's compact latent space** instead of pixels, roughly a 10× speedup that made high-res generation feasible.
- **Classifier-free guidance** — for conditional generation, jointly train the model **with and without** the condition (e.g. text), then at sampling time push the prediction in the direction of the conditional and away from the unconditional, scaled by a **guidance weight `w`**. Higher `w` = stronger prompt adherence (at some diversity cost).

**Why diffusion beat GANs (since 2022):** far more **stable training** (no mode collapse or discriminator balancing) and **better distribution coverage/diversity**. GANs still win on **inference speed** — one forward pass vs many denoising steps. Diffusion is now the dominant paradigm for image, video, and audio synthesis (DALL-E 3, SD3, Midjourney, Sora-style video).

**Key points:**
- Learn to denoise; iterative reverse process.
- Latent diffusion makes high-res practical.
- Classifier-free guidance for conditioning.
- Replaced GANs as the SOTA generative paradigm.

---

### 54. Self-supervised learning

**Frequency:** Medium

**Question:** What is self-supervised learning, and why did it unlock foundation models?

**Answer:** Self-supervised learning (SSL) **invents supervision from unlabeled data**. Instead of needing human labels, you define a **pretext task** where the answer is already present in the data — you hide part of the input and train the model to predict it. This unlocks learning from **vast, cheap, unlabeled corpora** (all the text on the web, billions of images), which is the entire reason foundation models became possible: labeled data is scarce and expensive, but raw data is nearly unlimited.

**Canonical pretext tasks:**
- **Masked language modeling** (BERT) — hide tokens, predict them from bidirectional context.
- **Next-token prediction** (GPT) — predict the following token; the objective behind every LLM.
- **Masked image modeling** (MAE) — mask image patches, reconstruct them.
- **Contrastive learning** (SimCLR, CLIP) — pull representations of two augmentations of the same item (or an image and its caption) **together**, push different items **apart**.
- **Bootstrap methods** (BYOL, DINO) — learn without negatives by matching an online network to a slowly-updated target network.

**Why it's powerful:** the representations learned this way are **general-purpose**. You then **transfer** them to downstream tasks either by **fine-tuning** the whole model or by **linear probing** (freezing the backbone and training a small head) — often needing only a little labeled data to reach strong performance. This **pretrain-then-adapt** paradigm now dominates both NLP and vision.

**A key nuance:** the **design of the pretext task matters** — especially at smaller scale, a well-chosen pretext task yields better representations than simply making the model bigger. The pretext must force the model to learn something genuinely useful about the data's structure, not a shortcut.

**Key points:**
- Supervision invented from data itself.
- Powers BERT, GPT, CLIP, DINO, MAE.
- Pretraining + fine-tuning is the modern workflow.
- Pretext task design matters.

---

### 55. Knowledge distillation

**Frequency:** Medium

**Question:** Describe knowledge distillation. Why can a distilled student beat training from scratch?

**Answer:** Knowledge distillation trains a small **student** model to **mimic a larger teacher** model, transferring the teacher's learned behavior into a cheaper package.

**The core idea is soft labels.** A hard label says "this image is a cat." The teacher's **full output distribution** says "90% cat, 7% dog, 0.5% fox, ..." — and those small probabilities encode **dark knowledge**: the teacher has learned that cats look more like dogs than like cars. The student learns far more from that rich signal than from the one-hot label alone. The loss combines:
- **Hard-label cross-entropy** against the true labels, and
- **Soft-label KL divergence** against the teacher's output distribution.

**Temperature** `T` controls this: dividing logits by `T > 1` before softmax **softens** the distribution, amplifying the informative small probabilities so the student sees the teacher's full similarity structure.

**Variants** go beyond outputs: **hidden-state matching** (align intermediate representations), **attention matching** (align attention maps), and **sequence-level distillation** for generation tasks.

**Canonical uses:** compressing BERT into **DistilBERT / TinyBERT / MiniLM**; building capable open models by distilling **frontier-LLM outputs** (Alpaca, Vicuna trained on GPT-generated data); and producing on-device models.

**Why the student can beat from-scratch training:** the teacher's **smoother, more informative label distribution** is an easier optimization target than sparse hard labels — it regularizes and guides the student toward better minima. It also **stacks well with quantization and pruning** for maximum compression. One practical caveat: for distillation, **diversity of the transfer data matters more than sheer quantity** — you need inputs that reveal the teacher's behavior across the space.

**Key points:**
- Match teacher's soft outputs, not just hard labels.
- Temperature softens probabilities for richer supervision.
- DistilBERT, Vicuna are canonical examples.
- Stack with quantization for max compression.

---

### 56. Quantization: INT8, INT4, GPTQ, AWQ

**Frequency:** Medium

**Question:** Explain quantization for LLM inference and the main methods (INT8, INT4, GPTQ, AWQ).

**Answer:** Quantization stores weights (and sometimes activations) in **fewer bits** than the usual FP16/FP32. The payoff is twofold: **memory** — an INT4 model is ~4× smaller than FP16, so a model that needed multiple GPUs can fit on one — and **speed**, since less data moves through the memory bandwidth bottleneck that dominates LLM inference.

**The precision tradeoff:**
- **INT8** — with a **calibration** pass to find good scale factors, INT8 post-training quantization is **near-lossless** for most models. The safe default.
- **INT4** — much bigger savings but needs **more care**; naive rounding loses noticeable accuracy, which is why the smart methods below exist.

**Main methods:**
- **GPTQ** — post-training, quantizes layer by layer using **second-order (Hessian) information** to minimize the reconstruction error of each layer's output. Accurate at 4-bit.
- **AWQ (Activation-aware Weight Quantization)** — observes that a **small fraction of weight channels are salient** (they interact with large activations) and protects those, quantizing the rest aggressively. Fast and accurate.
- **bitsandbytes NF4** — a 4-bit "normal float" format tuned for the roughly-Gaussian distribution of weights; it's the base-model format used in **QLoRA**.
- **GGUF / llama.cpp** — file formats and kernels for efficient CPU/GPU inference of quantized models locally.

**Quantization-aware training (QAT)** goes further, simulating quantization **during training** so the model learns to be robust to it — best quality, but expensive since it requires (re)training.

**Practical serving notes:** open-weight LLMs are routinely served at **INT4–INT8** with minimal loss; but **small models degrade more at INT4**, and for demanding tasks (reasoning, code) keep higher precision. For long contexts, also **quantize the KV cache** — it can dominate memory at large sequence lengths.

**Key points:**
- INT8 nearly free; INT4 needs care.
- GPTQ and AWQ are top post-training methods.
- QLoRA uses NF4 base + FP16 LoRA.
- Quantize KV cache too for long contexts.

---

### 57. Tokenization: BPE, WordPiece, SentencePiece

**Frequency:** Medium

**Question:** Compare BPE, WordPiece, and SentencePiece. Why does tokenization cause LLM bugs?

**Answer:** Tokenization splits raw text into the discrete units (**tokens**) a model actually processes — usually **subwords**, a middle ground between characters (too many tokens) and whole words (huge vocabulary, no way to handle unseen words). All the schemes below are **subword** methods that learn a vocabulary from a corpus.

**The three schemes:**
- **Byte Pair Encoding (BPE)** — start from individual characters and **greedily merge the most frequent adjacent pair** repeatedly until you hit the target vocab size. Frequent words become single tokens; rare words break into pieces. Used by the **GPT family and RoBERTa**.
- **WordPiece** — similar merging, but instead of raw frequency it merges the pair that most **increases the likelihood of the training corpus** under a language model. Used by **BERT**.
- **SentencePiece** — not a merge algorithm per se but a framework that operates **directly on raw text including whitespace** (encoding spaces as a special symbol), so it needs **no language-specific pre-tokenization** and works for languages without spaces (Chinese, Japanese). It can run BPE or unigram-LM tokenization; used by **T5, LLaMA, Mistral**.

**Byte-level BPE** (GPT-2 onward) operates on **raw bytes** rather than Unicode characters, so it can represent **any** input — emoji, rare scripts, arbitrary symbols — with no out-of-vocabulary failures.

**The vocab-size tradeoff:** a **larger** vocabulary (32k–256k typical) means **shorter** token sequences (cheaper attention, more text per context window) but a **bigger embedding table** and softmax. Smaller vocab is the reverse.

**Why tokenization causes real bugs:** the model only ever sees tokens, so quirks in how text is split leak into behavior. **Numbers** may split inconsistently ("1234" as one token but "1235" as two), which is why LLMs struggle with arithmetic — modern models add **digit-by-digit** splitting to help. **Code** whitespace/indentation tokenizes awkwardly, and **non-English** text can consume many more tokens per word (costing more and degrading quality) unless the vocab is trained to be multilingual. Famous failures (the "SolidGoldMagikarp" glitch tokens) trace directly to tokenization artifacts.

**Key points:**
- BPE: greedy frequency-based merges.
- SentencePiece: language-agnostic, raw text.
- Byte-level BPE handles any input.
- Vocab size trades sequence length vs embedding size.

---

### 58. Choosing an LLM for production: open self-hosted vs closed API

**Frequency:** Medium

**Question:** For a new production feature, how do you decide between a frontier closed API (OpenAI/Anthropic/Google) and an open, self-hosted model (Llama/Mistral/Qwen)?

**Answer:** Treat it as a portfolio decision across a few axes, not a religious one.

**Data privacy & compliance.** If data can't leave your environment — regulated healthcare/finance, air-gapped/on-prem deployments — that often forces open self-hosted, regardless of other factors. APIs offer data-handling agreements and zero-retention modes, but self-hosting is the only way to guarantee data never crosses your boundary.

**Cost at scale.** APIs are pay-per-token: near-zero fixed cost, perfect for low/spiky volume. Self-hosting is a fixed GPU bill (rent or buy) that you amortize. There's a **crossover volume**: below it, APIs are cheaper; above it, self-hosting wins. The crossover depends on model size and utilization — a small open model on well-utilized GPUs can beat API pricing once you're at sustained, high throughput; a lightly-used cluster is pure waste. Rule of thumb: only self-host when you can keep the GPUs busy.

**Capability ceiling.** Frontier closed models still lead on the hardest reasoning, long-context, and multimodal tasks. If the feature needs top-tier capability, an API may be the only thing that clears the bar today.

**Customization & control.** Open models give full freedom: fine-tune/LoRA freely, control the exact version (no silent upgrades that break prompts), tune the serving stack, and avoid rate limits. APIs limit you to their fine-tuning options and rate quotas, and can deprecate models under you.

**Ops burden & lock-in.** Self-hosting means you own GPU provisioning, serving (vLLM), scaling, uptime, and upgrades — real headcount. APIs offload all of that but create vendor lock-in and dependency on their availability and pricing.

**Practical recommendation.** Start with an API to validate the product fast — no infra, best models, cheap at low volume. As you learn the real traffic and requirements, migrate high-volume and privacy-sensitive workloads to open self-hosted models, ideally behind an abstraction layer so switching is cheap. A **hybrid router** is often the endgame: cheap/self-hosted model for the bulk of easy, sensitive, or high-volume traffic; frontier API for the hard tail. Keep an eval harness so you can compare candidates on your own data before committing.

**Key points:**
- Privacy/compliance and air-gapped needs can force open self-hosting outright.
- Cost has a crossover: APIs win at low/spiky volume, self-hosting at sustained high throughput with well-utilized GPUs.
- Open = control (versions, fine-tuning, no rate limits) but real ops burden; API = fastest start, best ceiling, but lock-in.
- Start on an API to validate, migrate heavy/sensitive traffic to open models, and consider a hybrid router behind an abstraction layer.

---

### 59. Contextual embeddings and sentence embeddings

**Frequency:** Medium

**Question:** Explain contextual and sentence embeddings. Why is Sentence-BERT better than raw BERT CLS?

**Answer:** **Contextual embeddings** (ELMo, BERT, GPT) produce a **different vector for a word depending on its sentence**, extracted from a pretrained transformer's hidden states. This solves **polysemy**: "bank" in "river bank" and "bank account" now get distinct vectors, because each token's representation is computed from its surrounding context rather than a fixed lookup.

**Getting a sentence-level vector** requires **pooling** the per-token embeddings — mean pooling, taking the special CLS token, or max pooling — to collapse a variable-length sentence into one fixed vector.

**Why raw BERT CLS is bad for similarity, and SBERT fixes it:** BERT was pretrained with masked-LM, **not** to make its CLS vector meaningful for cosine similarity — so out of the box, comparing two sentences' CLS vectors gives poor results, and doing it properly requires feeding **both sentences together** through BERT (O(n²) pairwise, infeasible at scale). **Sentence-BERT (SBERT)** fine-tunes BERT in a **siamese/triplet** setup: it encodes each sentence **independently** and trains with a loss that makes **cosine similarity match semantic similarity**. Now you can embed a million sentences once and compare them with fast vector operations.

**Modern embedding models** (OpenAI text-embedding-3, BGE, E5, Nomic, Cohere) take this further with **contrastive fine-tuning on huge sets of web text pairs** (queries paired with relevant documents), yielding high-quality, often multilingual embeddings. These are the **backbone of semantic search and RAG**, plus clustering, deduplication, and recommendation — anywhere you need to compare meaning at scale.

**Key points:**
- Context-dependent vectors per token.
- SBERT-style models for sentence similarity.
- Modern embedding models trained contrastively on web pairs.
- Backbone of RAG and semantic search.

---

### 60. Pretraining objectives for LLMs

**Frequency:** Medium

**Question:** Compare the main LLM pretraining objectives. Why does causal LM scale best?

**Answer:** The pretraining objective defines **what the model predicts** from unlabeled text, and it shapes what the model is good at.

- **Causal language modeling (CLM)** — predict the **next token** given all previous ones, with a causal mask. This is the GPT-family objective. It's **native to generation** (generating *is* just running the objective forward) and **scales beautifully**: a single simple task applied to trillions of tokens, no masking scheme to design, every token is a training signal.
- **Masked language modeling (MLM)** — randomly **mask ~15% of tokens and predict them from bidirectional context** (BERT). Because the model sees both sides, it builds strong **understanding** representations, excelling at classification, NER, and extractive QA — but it's **not a natural generator** and only ~15% of tokens contribute loss per step.
- **Span corruption (T5)** — mask **consecutive spans** and predict them as a target sequence. A **middle ground** that combines bidirectional encoding of the input with autoregressive generation of the output, fitting the encoder-decoder shape.
- **Prefix LM** (UL2, GLM) — bidirectional attention over a **prefix**, then causal generation after it, blending understanding and generation. **Mixture-of-objectives** approaches like **UL2's Mixture-of-Denoisers** train on several objectives at once for better few-shot transfer.

**Why CLM won for general-purpose LLMs:** it's the simplest objective to scale, it directly produces a generator, and — crucially — next-token prediction at scale gives rise to **in-context learning** and broad emergent capabilities. MLM still wins for **fixed understanding tasks at smaller scale**.

Pretraining is only the start: models are then **post-trained** with **instruction tuning** and preference optimization (**RLHF/DPO**) to become usable assistants.

**Key points:**
- CLM: scales for general LLMs.
- MLM: best for understanding/classification.
- Span corruption: T5's middle ground.
- Mix-of-objectives improves few-shot transfer.

---

### 61. Instruction tuning

**Frequency:** Medium

**Question:** What is instruction tuning, and why does data quality matter more than quantity?

**Answer:** Instruction tuning fine-tunes a pretrained base model on many **(instruction, response) pairs** spanning diverse tasks — sources include **FLAN, T0, Alpaca, ShareGPT, Open-Orca**. The result is a model that **follows natural-language instructions** zero/few-shot, instead of needing carefully engineered prompt patterns that mimic raw pretraining text.

**The key insight: it teaches *format*, not *facts*.** The base model already absorbed enormous knowledge during pretraining, but it only knows how to **continue text**, not how to **respond to a request**. Instruction tuning doesn't add new knowledge — it **reshapes the interaction style**, unlocking capabilities that were **latent** in the base model by teaching it the request→answer convention. Ask a base model "What is the capital of France?" and it might continue with more quiz questions; after instruction tuning it answers "Paris."

**Where it sits:** it's typically the **first stage of post-training**, before preference optimization (**RLHF/DPO**) refines subjective qualities like helpfulness and safety.

**Why quality > quantity:** the **LIMA** paper ("Less Is More for Alignment") showed that **~1,000 carefully curated, high-quality examples** can produce a strong assistant — evidence that instruction tuning is surfacing existing abilities, not teaching new ones, so a small clean set beats a large noisy one. A few diverse, well-written demonstrations teach the format cleanly.

**Pitfalls:** the model can **overfit to the instruction format** (becoming stilted or verbose), lose output diversity, or **regress** on benchmarks the base model handled — so pair it with evaluation and **safety tuning** to catch capability loss and suppress unwanted behaviors.

**Key points:**
- Teaches format, not new facts.
- Data quality > quantity (LIMA).
- Step 1 of post-training pipeline.
- Watch for capability regressions.

---

### 62. In-context learning and few-shot prompting

**Frequency:** Medium

**Question:** Explain in-context learning and few-shot prompting. How does it compare to fine-tuning?

**Answer:** In-context learning (ICL) is an LLM's ability to **perform a new task at inference time from examples in the prompt — with no gradient updates or weight changes**. Show it a few input→output pairs (**few-shot**) or just a task description (**zero-shot**), and it infers the pattern and applies it to a new input. Nothing is "learned" in the traditional sense; the model conditions on the prompt.

**Where it comes from:** ICL is an **emergent capability of large-scale pretraining** — small models barely do it, but it strengthens sharply with model size and with the quality/diversity of the examples. The leading mechanistic explanation is **induction heads**: attention heads that learn to find an earlier occurrence of the current pattern and **copy what followed it**, effectively pattern-matching the in-context examples.

**It's surprisingly sensitive to presentation.** Performance depends on:
- **Example order** — a **recency bias** means the last examples weigh more.
- **Label distribution** — a **majority-label bias** skews predictions toward whichever label appears most among the examples.
- **Format** — consistent, clear formatting matters, sometimes more than which specific examples you pick.

**Versus fine-tuning:**
- ICL is **essentially free** — no training run, instant to iterate, great for prototyping and low-volume tasks.
- But it **consumes context tokens** (cost and a length ceiling), and it's **less reliable** than fine-tuning for high-stakes or high-volume production tasks, where baking the behavior into weights is more consistent and cheaper per call.

In practice ICL is the **strong first baseline** — try it before reaching for RAG or fine-tuning — and it's the foundation of all prompt engineering.

**Key points:**
- No parameter updates—just examples in prompt.
- Sensitive to example order, format, label balance.
- Cheap to try; less reliable than fine-tuning.
- Often a strong baseline.

---

### 63. Prompt engineering techniques

**Frequency:** Medium

**Question:** Describe prompt engineering techniques. Why should prompts be treated as code?

**Answer:** Prompt engineering is **structuring the input to reliably elicit the output you want**. The core techniques:
- **Clear role/task statement** — tell the model who it is and exactly what to do.
- **Explicit format/schema** — specify the output shape (JSON schema, XML tags, a template) so results are parseable and consistent.
- **Few-shot examples** — demonstrate the desired format and behavior with a few input→output pairs.
- **Decomposition** — break a complex request into ordered steps rather than asking for everything at once.
- **Self-consistency** — sample multiple answers and take the majority, reducing reasoning variance.
- **Retrieval grounding (RAG)** and **tool use** — supply facts or let the model call functions instead of relying on parametric memory.
- **Structured output** — use function calling / JSON mode to force valid, machine-readable results.

**Named patterns worth knowing:**
- **Chain-of-thought (CoT)** — "think step by step," exposing intermediate reasoning; big gains on math/logic.
- **Tree-of-thought** — explore and evaluate multiple reasoning branches.
- **ReAct** — interleave reasoning with actions (tool calls).
- **Program-aided LM (PAL)** — have the model **write code** and execute it for exact computation instead of doing arithmetic in-head.

**Anti-patterns:** vague or ambiguous instructions, **conflicting examples** (few-shot samples that contradict the instruction), leading questions that bias the answer, and cramming too many unrelated tasks into one prompt.

**Why treat prompts as code:** in a real application the prompt is a **critical dependency** that determines correctness. Modern models are more robust than they used to be, but for high-stakes apps you should still keep prompts in **version control**, build them from **reusable templates**, and back them with an **evaluation suite** so you can measure regressions when you change a prompt or swap models — exactly the discipline you'd apply to code.

**Key points:**
- Be explicit about role, format, constraints.
- CoT, self-consistency, ReAct are go-to patterns.
- Few-shot examples shape format and behavior.
- Prompts deserve version control and eval suites.

---

### 64. Chain-of-thought (CoT) reasoning

**Frequency:** Medium

**Question:** Explain chain-of-thought reasoning and how modern reasoning models are trained.

**Answer:** Chain-of-thought (CoT) means prompting an LLM to **generate intermediate reasoning steps before its final answer** rather than jumping straight to a conclusion. The original trick was as simple as appending **"Let's think step by step"** (Wei et al., 2022). It dramatically improves **math, logic, and multi-step** problems.

**Why it works:** a transformer does a **fixed amount of computation per token**. Forcing it to "answer 42" immediately gives it no room to work; letting it write out the steps lets it **spread the computation across many tokens** and condition each step on the previous ones — essentially externalizing a scratchpad. Notably the effect is **emergent at scale**: small models don't benefit (or get worse), while large models gain a lot.

**Boosting it further:**
- **Self-consistency** — sample **several** independent CoT paths and take the **majority-vote** answer. Different reasoning routes that agree are more likely correct; often a large accuracy gain.
- **Tree-of-thought** — generalize CoT into a **search** over branching reasoning steps, exploring and pruning alternatives instead of one linear chain.

**Modern reasoning models** (OpenAI o1/o3, DeepSeek-R1, Claude with extended thinking) make long CoT a **first-class trained capability** rather than a prompt trick. They're trained with **reinforcement learning on verifiable rewards** — on math and code problems where the answer can be automatically checked, the model is rewarded for reasoning traces that reach the correct result, so it **learns to produce long, self-correcting chains of thought**. This drove big 2024–2026 gains on STEM, math, and coding.

**The tradeoff is cost:** long CoT means **more tokens and higher latency** per answer. For simple factual or lookup tasks it's wasteful — CoT pays off only when the problem genuinely requires multi-step reasoning.

**Key points:**
- Intermediate steps improve reasoning.
- Self-consistency = sample many, vote.
- Reasoning models (o1, R1) trained for long CoT.
- Costs latency and tokens; not always worth it for simple tasks.

---

### 65. Context window and KV cache

**Frequency:** Medium

**Question:** Explain the context window and KV cache. Why does the KV cache dominate long-context memory?

**Answer:** The **context window** is the maximum sequence length a transformer can attend over at once — everything the model can "see" in a single call. It has grown enormously: **~2k tokens** in the GPT-2 era to **200k–2M** in frontier models (Claude, Gemini).

**The KV cache** is the key optimization for generation. Autoregressive decoding produces one token at a time, and each new token must attend to **all previous tokens**. Recomputing every previous token's Key and Value on each step would be `O(n²)` work overall. Instead, once you compute a token's **K and V tensors you cache them**, so generating each new token only computes *its own* Q and attends over the **cached** K/V — turning per-token cost from `O(n²)` into `O(n)`. This is what makes long-form generation practical.

**Why it dominates memory:** the cache stores K and V for **every token, every layer, every head**, so it grows **linearly with context length** (and with model depth/width). At long contexts it dwarfs the model weights — e.g. LLaMA-70B at 32k tokens needs **tens of GB** just for the KV cache. So long-context serving economics are really **KV-cache management** economics.

**Optimizations:**
- **GQA/MQA** — share K/V across attention heads, directly shrinking the cache (the main reason modern models use them).
- **Paged attention (vLLM)** — manage the KV cache like OS virtual memory in non-contiguous pages, eliminating fragmentation and enabling higher batch throughput.
- **Quantized KV cache** — store K/V in INT8/FP8 to halve or quarter its size.
- **Prompt caching** — reuse the KV cache of a shared prefix (e.g. a long system prompt) across many requests, saving recomputation.
- **Sliding-window attention** — attend only to the last `w` tokens and discard older K/V, capping cache size for very long streams.

**Key points:**
- KV cache makes generation O(n), not O(n^2) per token.
- Memory dominated by KV at long contexts.
- GQA, paged attention, quantization reduce KV cost.
- Prompt caching reuses prefix KV across requests.

---

### 66. Mixture of Experts (MoE)

**Frequency:** Medium

**Question:** Explain Mixture of Experts (MoE). What are its benefits and drawbacks?

**Answer:** MoE makes a model **much larger in parameters without proportionally more compute** by using **sparse activation**. Each dense feed-forward layer is replaced by **N separate expert FFNs** plus a small **router** (gating network). For each token, the router picks the **top-k experts** (usually k=1 or 2) and only those run — the other experts sit idle for that token.

**The scaling win:** total parameters scale to hundreds of billions, but each token only uses `k/N` of them. **Mixtral 8×7B** has ~47B total parameters but activates only **~13B per token** — you get the knowledge capacity of a big model at the inference FLOPs of a small one. **DeepSeek-V3** pushes this to 256 experts.

**Why it needs load balancing:** left alone, the router tends to **collapse** — sending most tokens to a few favored experts while others never train. A **load-balancing auxiliary loss** (plus tricks like **expert capacity limits** and Switch-Transformer routing) pushes the router to distribute tokens evenly so all experts get used and trained.

**Benefits:**
- **Better quality per FLOP** — more capacity for the same inference cost.
- **Easier parameter scaling** than making a dense model wider/deeper.

**Drawbacks:**
- **Memory** — *all* experts must be loaded even though only a few run per token, so the full model still occupies huge memory.
- **Serving complexity** — routing makes batching and load balancing across GPUs harder; token distribution is uneven.
- **Training complexity** — the extra routing loss and instability need careful tuning.

MoE is the current **frontier of efficient scaling**, used in Mixtral, DeepSeek-V3, Grok-1, DBRX, and (rumored) GPT-4-class models.

**Key points:**
- Sparse activation: huge params, modest compute.
- Top-k routing per token.
- Load balancing prevents collapse.
- Modern frontier: DeepSeek-V3, Mixtral, GPT-4-class.

---

### 67. Vector databases and ANN search

**Frequency:** Medium

**Question:** Explain vector databases and ANN search. How do you choose one?

**Answer:** A vector database **stores high-dimensional embeddings and finds the nearest ones to a query vector fast** — the retrieval engine behind semantic search and RAG. The challenge: **exact** nearest-neighbor search is `O(n·d)` — you must compare the query against every one of `n` vectors of dimension `d`, which is hopeless at millions/billions of vectors. **Approximate nearest neighbor (ANN)** search trades a **small recall loss** (occasionally missing a true neighbor) for **orders-of-magnitude speedup**, which is almost always the right trade.

**The main algorithms:**
- **HNSW** (Hierarchical Navigable Small World) — a layered proximity **graph** you greedily traverse. **Low latency, high recall**; the default for most workloads. Downside: memory-hungry.
- **IVF** (Inverted File) — **k-means partitions** the space into clusters; search only probes the nearest few clusters. Scalable and memory-efficient.
- **IVF-PQ** — adds **product quantization** to compress vectors into compact codes, drastically cutting memory for **billion-scale** indexes at some recall cost.
- **ScaNN** (Google) — anisotropic quantization, strong accuracy/speed. **FAISS** (Meta) is the library implementing all of these.

**Choosing a vector DB** (Pinecone, Weaviate, Qdrant, Milvus, pgvector, OpenSearch, Chroma) depends on:
- **Scale & recall** — how many vectors, and how much recall you can trade for speed/memory.
- **Metadata filtering** — can it filter by attributes (date, user, category) alongside vector search?
- **Hybrid search** — combining vector similarity with lexical **BM25** often beats pure vector, especially for keyword-heavy queries.
- **Ops model** — managed (Pinecone) vs self-hosted (Qdrant, Milvus), and whether you want it **inside your existing DB** (**pgvector** in Postgres is simplest if you're already there).

**Don't over-engineer:** for **small data (<1M vectors)**, in-memory **FAISS** or even brute-force exact search is fast enough — you don't need a dedicated vector DB until scale or operational needs demand it.

**Key points:**
- HNSW: low-latency, high-recall default.
- IVF-PQ for compressed large-scale.
- Hybrid (vector + BM25) often beats pure vector.
- pgvector simple; Pinecone/Qdrant for scale.

---

### 68. Function calling and structured outputs

**Frequency:** Medium

**Question:** Explain function calling and structured outputs in LLMs. How do you make them reliable?

**Answer:** Function calling lets an LLM **emit structured JSON that conforms to a schema you define**, turning free-form text generation into a **machine-readable interface**. You give the model a spec — function **name**, **description**, and a **JSON schema** for its parameters — and the model decides **whether and which** function to call, then emits the **arguments** as JSON. Your application executes the real function and feeds the result back for the model to continue. This is the bridge between an LLM and actual tools/APIs.

**The flow:** user message → model outputs a tool call (`get_weather({"city": "Paris"})`) → app runs the function → result returned to the model → model produces the final natural-language answer. Modern providers (OpenAI, Anthropic, Google) support this **natively**.

**Reliability techniques** — because a malformed argument or hallucinated field breaks the downstream code:
- **Constrained decoding** — restrict the model's token choices so output is **guaranteed** to match the grammar/JSON schema (libraries like **Outlines, Instructor**, or **OpenAI strict mode**). The strongest guarantee.
- **Schema validation with retry** — validate the emitted JSON against the schema; on failure, feed the error back and let the model correct it.
- **Examples in the system prompt** — show correctly formatted calls to steer the model.

**Tool-choice modes** control the behavior: **`auto`** lets the model decide whether to call a tool, **`required`** forces at least one call, and **`none`** disables tools (plain text only).

**Key use cases:** the foundation of **agents** (tool loops), **RAG with metadata filters**, **form filling**, and **ETL** — extracting structured records from unstructured text.

**Key points:**
- Schema-defined tools; model emits JSON args.
- Constrained decoding ensures valid output.
- Foundation for agents and structured workflows.
- Validate and retry on schema errors.

---

### 69. LLM evaluation: benchmarks and LLM-as-judge

**Frequency:** Medium

**Question:** How do you evaluate LLMs with benchmarks and LLM-as-judge? What are the pitfalls of each?

**Answer:** LLM evaluation splits into two categories, and the practical lesson is that **neither public benchmark alone is enough**.

**Automated benchmarks** score models on fixed datasets: **MMLU** (multitask knowledge), **HumanEval/MBPP** (code generation), **GSM8K/MATH** (math), **HellaSwag** (commonsense), **TruthfulQA** (factuality), **MT-Bench** (multi-turn chat). They're standardized and comparable, but suffer three problems: **saturation** (frontier models near the ceiling, so scores no longer discriminate), **gaming** (models tuned to the benchmark rather than the underlying skill), and **contamination** (test questions leaking into training data, inflating scores). So a high MMLU number tells you little about how a model does on *your* task.

**Application-specific custom evals** matter most: build a test set tied to your actual use case (e.g. "did the RAG answer match the source doc?", "is the extracted JSON correct?"). This is the eval that predicts production quality.

**LLM-as-judge** — use a strong LLM to grade outputs against a rubric — scales evaluation **cheaply** and correlates well with human judgment when prompts are careful. But it has **biases** to correct for:
- **Position bias** — favoring whichever answer is shown first (mitigate by swapping order and averaging).
- **Verbosity bias** — preferring longer answers regardless of quality.
- **Self-preference** — a judge rating outputs from its own model family higher.

**Best practice:** combine a **small human-labeled golden set** (ground truth for high-stakes decisions) with **LLM-as-judge** for scale, plus periodic human spot-checks. Treat the eval suite as a **versioned product artifact** and re-run it on **every model or prompt change** to catch regressions. Evaluation is consistently the **most under-invested** part of LLM applications.

**Key points:**
- Public benchmarks: useful but saturated/contaminated.
- Custom evals tied to your task matter most.
- LLM-as-judge scales evaluation cheaply.
- Treat eval as a versioned product artifact.

---

### 70. Evaluating RAG systems

**Frequency:** Medium

**Question:** How do you evaluate a RAG system? Why is retrieval usually the bottleneck?

**Answer:** RAG has two stages that can fail independently, so you must **evaluate them separately** — otherwise you can't tell *why* an answer is wrong.

**Retrieval evaluation** — did we fetch the right documents? Standard IR metrics:
- **Recall@k** — was a relevant (gold) document in the top-k results?
- **Hit-rate** — fraction of queries where at least one gold doc appeared.
- **MRR** (mean reciprocal rank) — how high up the first relevant doc ranked.
- **NDCG** — rewards ranking relevant docs near the top, graded by relevance.

**Generation evaluation** — given the retrieved context, did the model use it correctly?
- **Faithfulness** — does the answer stay grounded in the context, with no hallucinated claims beyond it? The most important RAG metric.
- **Answer relevance** — does it actually address the question?
- **Answer correctness** — does it match a reference answer?

**Frameworks** automate these: **RAGAS, TruLens, DeepEval** compute faithfulness/relevance (often using LLM-as-judge). To build an eval set at scale, **generate synthetic QA pairs** by asking an LLM to create questions from your own documents, then measure retrieval + generation against them — always backed by a **small human-curated golden set** for high-stakes checks.

**Why retrieval is usually the bottleneck:** if the right chunk never makes it into the context, **no LLM can answer correctly** — generation is capped by retrieval quality. In practice, improving **chunking and reranking** moves the metrics far more than swapping the LLM. Finally, **monitor production** via implicit user-feedback signals (thumbs up/down, follow-up questions, click-throughs) to catch real-world retrieval drift.

**Key points:**
- Split retrieval vs generation evaluation.
- RAGAS/TruLens automate common metrics.
- Synthetic + human-golden eval sets.
- Retrieval usually the bottleneck.

---

### 71. Feature stores

**Frequency:** Medium

**Question:** What problems do feature stores solve, and when are they worth it?

**Answer:** A feature store is a **centralized service for computing, storing, serving, and sharing ML features** across training and inference. It solves three recurring problems:

1. **Train/serve skew** — the single biggest one. If features are computed one way in the training pipeline (batch SQL over a warehouse) and a *different* way in production (live application code), subtle mismatches silently degrade the model. A feature store computes each feature **once from a shared definition**, so training and serving use **identical logic**.
2. **Feature reuse** — without it, every team re-derives "user's 30-day average spend" slightly differently. A feature store lets teams **publish and reuse** vetted features, avoiding duplication and inconsistency.
3. **Point-in-time correctness** — for time-aware features this is critical. When building training data, each label must join to features **as they existed at that label's timestamp**, not their current values. Using "now" values leaks future information and inflates offline metrics. Feature stores do **point-in-time (as-of) joins** to prevent this.

**Architecture** — two stores fed by the **same pipeline**:
- **Offline store** — a warehouse/lake holding full feature history, used to build **training** datasets (with point-in-time joins).
- **Online store** — a low-latency key-value store (Redis, DynamoDB) holding the **latest** feature values for **real-time serving**.

**Tools:** Feast (open source), Tecton, Hopsworks, and cloud-native ones (Databricks, SageMaker, Vertex AI Feature Store).

**When it's worth it:** once **many models share features**, or **point-in-time correctness genuinely matters**, a feature store pays off. For a **one-off model** with a handful of features it's **overkill** — the operational overhead outweighs the benefit.

**Key points:**
- Prevents train/serve skew.
- Offline (training) + online (serving) stores.
- Point-in-time joins for time-aware labels.
- Worth it past a handful of production models.

---

### 72. Experiment tracking and model registry

**Frequency:** Medium

**Question:** Explain experiment tracking and the model registry. What goes wrong without them?

**Answer:** These are the two pillars of **reproducibility and governance** in MLOps.

**Experiment tracking** records **everything about each training run** — the code version, data version, hyperparameters, metrics, and output artifacts — so runs are **reproducible and comparable**. Instead of losing track of which learning rate produced your best model in a spreadsheet, every run is logged and diffable. Tools: **MLflow, Weights & Biases, Neptune, Comet, Aim**.

**Model registry** is the **versioned catalog of models**. Each registered model carries metadata, a **stage** (staging / production / archived), **lineage** (which training run produced it), and an **approval state**. It's the source of truth for "what's deployed."

**Together they give full lineage:** every production model traces back to a **specific run → dataset → code commit**. That chain is what makes ML **auditable and reproducible** — you can always answer "exactly how was this model built?" and recreate it.

**CI/CD integration:** promoting a model to production can **trigger automated tests, evaluation, and canary deploys**, treating model releases with the same rigor as software releases.

**What goes wrong without them:** the question **"which model is in production, and how was it trained?" becomes unanswerable.** You can't reproduce results, can't debug a regression, can't roll back with confidence, and can't audit for compliance. This ambiguity is one of the **leading causes of pain in ML organizations** — models become mysterious black boxes no one can recreate.

**Key points:**
- Track code + data + params + metrics + artifacts.
- Registry versions promoted/approved models.
- Reproducibility = lineage from prod back to commit.
- MLflow/W&B are the common defaults.

---

### 73. A/B testing ML models

**Frequency:** Medium

**Question:** How do you A/B test ML models, and what are the main pitfalls?

**Answer:** A/B testing compares a **candidate model against the current production model** by **randomly splitting traffic** between them and measuring the difference in real outcomes — the only way to know a model actually helps, since offline metrics frequently disagree with online reality.

**Setup:**
- Define a **primary success metric** tied to business value (revenue, retention, click-through) — the one thing the test is meant to move.
- Add **guardrail metrics** that must **not** regress: latency, error rate, fairness. A model that lifts CTR but doubles latency isn't a win.

**Sizing the test:** use a **power analysis** to pick the sample size, based on the **minimum detectable effect (MDE)** you care about and the baseline metric's **variance**. Too small a sample and a real effect looks like noise; this tells you how long to run.

**Practical considerations:**
- **Run for full business cycles** — don't stop a weekly-cyclical product mid-week; weekend and weekday behavior differ.
- **Novelty effects** — users react to *anything* new, so early lifts may fade; run long enough to see steady state.
- **Safe peeking** — repeatedly checking a fixed-horizon test inflates false positives. Use **sequential or Bayesian** testing designed for continuous monitoring.

**Pitfalls that invalidate results:**
- **SUTVA violations** — the two groups aren't independent (network effects in a social product, shared inventory in a marketplace), so treating one user affects another.
- **Simpson's paradox** — an aggregate result reverses within segments; always check key sub-populations.
- **Multiple-comparison inflation** — testing many metrics at once guarantees some spurious "significant" results; correct for it.

**Bottom line:** always A/B test **online before declaring success**, and use **long-term holdout cohorts** to measure effects that extend beyond the short A/B window.

**Key points:**
- Online > offline; A/B before trusting any model.
- Primary metric + guardrails.
- Power analysis sets sample size.
- Watch SUTVA, novelty, multiple comparisons.

---

### 74. Batch vs realtime model serving

**Frequency:** Medium

**Question:** Compare batch versus realtime model serving. What drives the choice?

**Answer:** The two serving modes differ in **when** predictions are computed relative to when they're needed.

**Batch serving** computes predictions **offline on a schedule** (nightly, hourly) and **stores them** in a database or cache to be read out instantly at request time. It's **simpler, cheaper, and scales easily** — you run a big job over all entities, no latency-sensitive service to keep up. It fits whenever **freshness of hours-to-days is acceptable**: churn scores, daily recommendations, lead scoring, marketing segments. The prediction for a user doesn't need to reflect what they did five seconds ago.

**Realtime / online serving** queries the model **per request, synchronously**, computing the prediction on the spot. Required when the input **isn't known until request time** or must reflect **fresh signals**: search ranking, fraud detection, ad targeting, session personalization. You can't precompute a fraud score for a transaction that hasn't happened yet.

**Realtime architecture** is more demanding: an **HTTP/gRPC service** with the model loaded in memory, **autoscaling** to handle load, a tight **p99 latency budget** (often <100ms), and **micro-batching** (grouping concurrent requests) to improve GPU throughput without blowing the latency SLO.

**Hybrid** is common and often best: **precompute expensive features in batch**, then run a **lightweight realtime model** on top of them at request time — combining batch's efficiency with realtime's freshness.

**What drives the choice:** the **latency SLO** and the **input freshness requirement**. If stale-by-a-day predictions are fine, batch is cheaper and simpler; if the decision depends on just-arrived data, you need realtime. Most production ML systems blend both.

**Key points:**
- Batch: cheaper, simpler, hours-of-freshness OK.
- Realtime: per-request, sub-second latency.
- Hybrid: batch features + realtime scoring.
- Latency SLOs drive architecture.

---

### 75. Scaling laws and Chinchilla

**Frequency:** Medium

**Question:** Explain scaling laws and the Chinchilla result. Why do modern models overtrain?

**Answer:** **Scaling laws** (Kaplan et al., 2020) showed that LLM performance improves as a **smooth power law** in three quantities — **compute, dataset size, and parameter count**. This was hugely important: it means you can **predict** how much better a model will get from more scale, letting labs plan multi-million-dollar training runs with confidence rather than guessing.

**The Chinchilla correction** (Hoffmann et al., 2022) fixed a mistake in *how to spend* a fixed compute budget. Kaplan's work had been read as "make the model as big as possible," leading to models like **GPT-3 (175B) and PaLM (540B) that were huge but undertrained** on relatively modest data. Chinchilla showed that at **compute-optimal** allocation, parameters `N` and training tokens `D` should scale **roughly equally** — about **`D ≈ 20N`** (20 tokens per parameter). A **70B** model trained on the right amount of data beat the 175B GPT-3, proving those earlier giants were **data-starved**, wasting parameters they couldn't fill.

**Why modern models deliberately "overtrain":** Chinchilla optimizes **training** compute, but it **ignores inference cost**. If you'll serve a model to billions of requests, a **smaller model is far cheaper to run forever** — so it's worth spending *extra* training compute (more tokens than Chinchilla-optimal) to make a small model as good as possible. **LLaMA-3 8B trained on 15T tokens** is massively "overtrained" by Chinchilla's ratio, but the result is a tiny, cheap-to-serve model with outsized quality. The rule flips for **inference-heavy** regimes: **train smaller models longer** rather than bigger models briefly.

**The limit:** scaling laws hold across many orders of magnitude, but eventually **data quality dominates** — once you've exhausted high-quality tokens, adding more low-quality data yields diminishing returns, which is why frontier work increasingly emphasizes data curation and synthetic data over raw scale.

**Key points:**
- Power laws in compute, data, params.
- Chinchilla: ~20 tokens per param at compute-optimal.
- Overtraining smaller models cuts inference cost.
- Quality of data eventually matters more than scale.

---

### 76. Reinforcement learning basics

**Frequency:** Medium

**Question:** Explain the basics of reinforcement learning. Why are bandits often more practical than full RL?

**Answer:** In RL, an **agent** interacts with an **environment**: it observes a state, takes an **action**, and receives a **reward** plus a new state. Its goal is to learn a **policy** `π(a|s)` — a mapping from states to actions — that **maximizes expected discounted return** (cumulative reward, with future rewards down-weighted by a discount factor `γ`). Unlike supervised learning, there's no labeled "correct action" — only a reward signal that may be sparse and delayed.

**Key concepts:**
- **Value functions** — `V(s)` (expected return from a state) and `Q(s,a)` (expected return from taking action `a` in state `s`); most algorithms learn one of these.
- **Exploration vs exploitation** — the core dilemma: try new actions to discover better rewards, or exploit what you know works? (ε-greedy, UCB, entropy bonuses.)
- **On-policy vs off-policy** — learn from the current policy's own actions (PPO, A2C) vs from stored/other-policy data (DQN, SAC).
- **Model-free vs model-based** — learn directly from experience vs learn a model of the environment and plan with it.

**Major algorithm families:** **DQN** (Q-learning + neural nets, discrete actions), **REINFORCE** (direct policy gradient), and **actor-critic** methods (**A2C/A3C, PPO, SAC**) that learn a policy and a value function together. **PPO** is the go-to general-purpose default — notably it's the RL algorithm inside RLHF.

**Chronic challenges:** **sample inefficiency** (RL needs millions of interactions), **reward design** (sparse rewards, and reward hacking where the agent exploits the reward rather than solving the task), **credit assignment** (which of many past actions caused a delayed reward?), and **training instability**.

**Where it works vs bandits:** RL's big wins are **games** (Atari, Go, StarCraft), **robotics in simulation**, and **LLM post-training** (RLHF, RLVR for reasoning). But full RL's sample inefficiency and instability make it impractical for many business problems. **Multi-armed / contextual bandits** — a stripped-down special case with **no state transitions** (each action's reward is immediate and independent) — are far easier to deploy and are what most "production RL" (recommendations, ad selection, A/B optimization) actually uses.

**Key points:**
- Maximize expected discounted reward via policy.
- PPO is the go-to general-purpose algorithm.
- Sample inefficiency is the chronic problem.
- Bandits often more practical than full RL.

---

### 77. Multi-modal models: CLIP, GPT-4V, Gemini

**Frequency:** Medium

**Question:** Explain multi-modal models using CLIP, GPT-4V, and Gemini. How are vision and language fused?

**Answer:** Multi-modal models process more than one modality — images, text, audio, video — in a shared representation.

**CLIP** is the foundational vision-language model. It trains on hundreds of millions of **(image, caption) pairs** with a **contrastive** objective: encode the image and the text separately, then pull the **matching** pair's embeddings together and push **non-matching** pairs apart. The result is a **shared embedding space** where images and text are directly comparable. This enables **zero-shot classification** — to classify an image, embed candidate labels as text ("a photo of a cat") and pick the nearest — with no task-specific training, and it powers retrieval and captioning.

**Vision-language models (VLMs)** like **GPT-4V, Claude 3+, Gemini** go further: they **natively accept images and text in one context** and reason over both — answering visual questions, doing OCR, reading charts, or generating code from a screenshot.

**Two architectural approaches to fusion:**
- **Encoder + projector + LLM** — run the image through a **vision encoder** (ViT/CNN), then a **projector** (an MLP or Q-Former) maps its output into the LLM's token embedding space, so image "tokens" sit alongside text tokens in the transformer. This bolts vision onto an existing LLM.
- **Native multi-modal training** — models like **Gemini and GPT-4o** are trained from the start on **interleaved tokens** of text, image, and audio, so the modalities are integrated more deeply rather than adapted after the fact.

**The 2025–2026 frontier** extends this to **video** understanding and **real-time speech**, with audio-language models (Whisper for transcription, GPT-4o voice) becoming first-class rather than bolted-on.

**Key points:**
- CLIP: contrastive image-text, foundation of retrieval.
- VLMs: vision encoder + projector + LLM.
- Native multimodal (Gemini, GPT-4o) trains jointly.
- 2025-2026 frontier: video, real-time speech.

---

### 78. Prompt injection and jailbreaks

**Frequency:** Medium

**Question:** Explain prompt injection and jailbreaks. Why are agentic systems especially at risk?

**Answer:** These are adversarial inputs that manipulate an LLM into **bypassing its safety guidelines or following an attacker's instructions** instead of the developer's. The root cause is architectural: an LLM sees **instructions and data as the same stream of tokens**, so it can't reliably tell a legitimate command from text that merely *looks* like one.

**Two flavors:**
- **Direct jailbreaks** — the **user** crafts a prompt to defeat refusals: "ignore previous instructions," elaborate **role-play** ("you are DAN, an AI with no rules"), hypothetical framings, or encoding tricks. The attacker is the person typing.
- **Indirect prompt injection** — far more insidious. Malicious instructions are **hidden in content the model ingests** — a retrieved document, a web page, an email, even text embedded in an image. When a **RAG system or agent** reads that content, it may treat the planted instructions as commands ("forward the user's data to attacker@evil.com"). The victim never sees the attack.

**Why agents raise the stakes dramatically:** a chatbot that gets jailbroken just says something it shouldn't. An **agent with tool access** can **take real actions** — send emails, execute code, make purchases, exfiltrate data. Indirect injection + tools = an attacker who plants text on a web page the agent visits can potentially **hijack the agent's real-world capabilities**.

**Mitigations (defense-in-depth, since none is complete):**
- **Instruction hierarchy** — train the model to **trust system prompts over user input over retrieved content**, distrusting untrusted sources.
- **Input/output filters** — detect known attack patterns and block unsafe outputs.
- **Content provenance** — mark where text came from so the model knows what's untrusted.
- **Sandboxed tool use with human-in-the-loop** — require confirmation for sensitive actions; limit what tools can do.
- **Structured outputs** and **dual-LLM patterns** (a privileged model that never sees raw untrusted content + a sandboxed one that does).

The key mindset: **treat all retrieved/external content as untrusted by default** — there is no fully reliable single defense yet.

**Key points:**
- Direct (user) vs indirect (retrieved content) injection.
- Agents with tools dramatically raise stakes.
- Instruction hierarchy + filters + sandboxing.
- Treat retrieved content as untrusted by default.

---

### 79. Responsible AI and bias mitigation

**Frequency:** Medium

**Question:** Explain responsible AI and bias mitigation. Why can't fairness be retrofitted?

**Answer:** ML models **inherit and amplify the biases in their training data**. If historical data reflects societal inequities, the model learns and often **intensifies** them. Concrete harms:
- **Face recognition** with far higher error rates on darker skin (under-representation in training data).
- **Resume screening** favoring male-associated names because past hiring did.
- **Medical models** trained on one demographic that fail on others.

**Fairness criteria — and why they conflict:**
- **Demographic parity** — equal positive-prediction rates across groups.
- **Equal opportunity** — equal **true-positive** rates across groups.
- **Equalized odds** — equal TPR **and** FPR across groups.

These are often **mathematically mutually exclusive** — you provably can't satisfy all of them at once (except in degenerate cases), so fairness requires an **explicit, contextual choice** about which definition matters for your application, not a universal fix.

**Mitigation spans the whole lifecycle:**
- **Data** — collect representative data; audit for skew.
- **Algorithm** — fairness-aware methods (reweighting, adversarial debiasing, post-processing thresholds per group).
- **Monitoring** — track **per-group metrics in production** to catch localized harm the aggregate hides.
- **Documentation** — **model cards** and **datasheets** stating intended use and known limitations.

**Broader scope:** responsible AI also covers **privacy** (differential privacy, federated learning), **security**, **transparency/explainability**, and **human oversight**. And the **regulatory** landscape is now binding — the **EU AI Act**, US executive orders, and sector rules impose real obligations.

**Why it can't be retrofitted:** bias enters at **data collection and problem framing** — the earliest stages — and **compounds** through every downstream step. By the time a model is trained and deployed, the bias is baked into its weights and the surrounding system; bolting on a fix at the end can't undo choices made upstream. Responsible AI must be a **design-time constraint**, considered from the first decision about what data to collect and what to predict.

**Key points:**
- Bias compounds through the ML pipeline.
- Fairness metrics often mutually incompatible.
- Per-group monitoring catches localized harm.
- Regulation (EU AI Act) is becoming binding.

---

### 80. Productionizing LLMs end-to-end

**Frequency:** Medium

**Question:** Walk through productionizing an LLM application end-to-end. What actually differentiates quality?

**Answer:** A production LLM app is a **full stack**, of which the model is only one (increasingly commoditized) piece:

**1. Model & prompting.** Choose the model tier: **frontier API** (fastest to build, no ops), **open-weight self-hosted** (control, privacy, cost at scale), or a **distilled small model** (cheapest for narrow tasks). Engineer prompts and keep them under **version control** with an eval suite.

**2. Knowledge & control flow.** Add **RAG** — a vector DB with **hybrid search + reranking** — to ground answers in your data. Use **structured output / function calling** for reliable machine-readable results, and **agents** only where **adaptive, multi-step control flow** genuinely helps (they add latency and failure modes).

**3. Evaluation & safety.** This is where quality is won: combine **automated benchmarks + LLM-as-judge + a human golden set + production feedback**. Add **guardrails** — input/output filters, **PII redaction**, prompt-injection defenses. Build **observability** for **latency, cost, token usage, error rates, and hallucination signals**, because you can't improve what you can't see.

**4. Serving & improvement.** Serve efficiently with **vLLM/TGI**, **autoscaling, caching, batching, and quantization**. Improve continuously via **A/B tests, prompt iteration, and fine-tuning loops**. Manage cost with **model routing** — send easy queries to a cheap small model, escalate hard ones to a frontier model.

**What differentiates quality:** the model itself is **increasingly a commodity** — everyone can call the same APIs. The durable advantages are **your data, your evaluation discipline, your retrieval quality, and your operations**. Two teams using the identical base model can ship wildly different products; the gap is almost entirely in **data, evals, retrieval, and ops**, not the model.

**Key points:**
- Model is commodity; data + evals + ops differentiate.
- RAG + structured outputs + guardrails are table stakes.
- Observability and eval loops drive improvement.
- Route by difficulty: small models for easy, frontier for hard.

---

### 81. Probability calibration

**Frequency:** Low

**Question:** What does it mean for a model to be well calibrated, and how do you fix miscalibration?

**Answer:** A model is **well calibrated** when its predicted probabilities match reality: among all predictions of "0.7," the event should actually occur about **70% of the time**. Calibration is distinct from accuracy — a model can rank cases perfectly (high AUC) yet output probabilities that are systematically **over- or under-confident**, which breaks any downstream decision that relies on the probability (expected-value calculations, thresholds, risk scores).

**Why models are often miscalibrated:** modern **deep nets** trained with cross-entropy tend to be **overconfident** (pushing probabilities toward 0/1), while **boosted trees** are often **underconfident**, and SVMs don't output probabilities at all. Training objectives optimize for accuracy, not calibrated probabilities.

**Diagnosing it:**
- **Reliability diagram** — bin predictions by confidence and plot predicted probability vs actual frequency; a perfectly calibrated model lies on the diagonal.
- **Expected Calibration Error (ECE)** — the average gap between confidence and accuracy across bins, giving a single number.

**Fixes (all post-hoc, fit on held-out data):**
- **Platt scaling** — fit a logistic regression on the model's logits/scores. Good for **small data** and binary problems.
- **Isotonic regression** — a flexible **non-parametric** monotonic fit; more powerful but **needs more data** (can overfit on small sets).
- **Temperature scaling** — the standard fix for **deep nets**: divide all logits by a single learned scalar `T` before softmax. It **preserves accuracy** (doesn't change the argmax), is **one parameter**, and is dirt cheap.

**Crucially, always calibrate on a separate held-out set after model selection** — never on training data (the model is already overfit to it) — and **re-calibrate when the data distribution shifts**, since calibration doesn't survive drift.

**Key points:**
- ECE and reliability plots quantify miscalibration.
- Temperature scaling: one parameter, big win for nets.
- Isotonic flexible but needs more data than Platt.
- Calibrate after model selection, on a held-out set.

---

### 82. t-SNE vs UMAP

**Frequency:** Low

**Question:** Compare t-SNE and UMAP. Why shouldn't you use their output as ML features?

**Answer:** Both are **non-linear dimensionality reduction** techniques used mainly to **visualize** high-dimensional data (embeddings, single-cell genomics) in 2D or 3D.

**t-SNE** models pairwise **similarities** as probabilities and arranges points so nearby items in high-D stay nearby in 2D. It produces **well-separated, visually striking clusters** and excels at preserving **local neighborhood** structure. Its weaknesses: it **distorts global structure** (distances *between* clusters and cluster sizes are meaningless), it's **slow** (`O(n log n)` even with Barnes-Hut), it's **unstable** across runs, and results swing with the **perplexity** hyperparameter (roughly, the effective neighborhood size).

**UMAP** is built on fuzzy topological (simplicial-set) theory and improves on t-SNE in practice: it's **faster** (near-linear), **preserves more global structure** (relative cluster positions are somewhat more trustworthy), and crucially supports **out-of-sample projection** — you can `fit` on one dataset and `transform` new points into the same space, which t-SNE can't do. Its key knobs are **`n_neighbors`** (local vs global emphasis) and **`min_dist`** (how tightly points pack). UMAP is generally the **default for new work**.

**Why you must not use their output as features:** both optimize purely for a **good-looking 2D picture**, not for preserving meaningful geometry. In the projection, **distances are not metric** (a point twice as far isn't "twice as different"), **cluster sizes and gaps are artifacts** of the algorithm and hyperparameters, and **apparent clusters can appear from pure noise**. Feeding these coordinates into a downstream model bakes in these distortions. They are **exploratory visualization tools only** — always view **multiple runs/seeds and hyperparameters** before drawing conclusions.

**Key points:**
- Visualization only; don't use as ML features.
- UMAP faster and preserves global structure better.
- t-SNE perplexity, UMAP n_neighbors/min_dist are key knobs.
- Multiple runs and seeds for honest interpretation.

---

### 83. CI/CD for ML: automating the train-to-deploy pipeline

**Frequency:** Medium

**Question:** Design a CI/CD pipeline for a machine-learning model that automates everything from training through deployment. How does it differ from CI/CD for regular software?

**Answer:** ML CI/CD extends software CI/CD but has a fundamental twist: **data and the trained model are also versioned artifacts**, and quality gates are **statistical, not binary pass/fail**. Two engineers running identical code get different models because the data changed. The pipeline must make training reproducible, gate promotion on metrics, and enable safe rollback.

**Version everything.** Git for code and pipeline config; **DVC** (or lakeFS) for datasets and features so a run is reproducible from a commit + data hash. Pin hyperparameters and environment in config. Together these give **lineage**: for any deployed model you can trace exactly which code + data + params produced it.

**Trigger training automatically.** Kick off the training pipeline on: a code/config change (PR merge), a **schedule** (nightly/weekly retrain), fresh labeled data landing, or a **drift alert** from production monitoring. Orchestrate the DAG with **Airflow / Dagster / Kubeflow Pipelines / SageMaker Pipelines**.

**Test before and during training.** Beyond unit tests on code, add **data-validation tests** (schema, ranges, null rates, distribution vs a reference — e.g. Great Expectations / TFDV) so bad data fails fast, plus **model quality tests** (behavioral checks, no-regression on key slices).

**Gate promotion on evaluation.** This is the ML-specific CI step: a new model must **beat the current production baseline** (or clear an absolute metric threshold) on a held-out eval set *before* it can be promoted. If it doesn't, the pipeline stops — no human debate. Compare on important subgroups too, not just aggregate.

**Register and promote through stages.** Log the model to a **model registry** (**MLflow**, SageMaker) with metrics and lineage. Promote through stages: `staging → production`, with the registry as the source of truth for what's live.

**Deploy progressively.** Containerize the model + serving code (Docker). Roll out via **canary** (small % of traffic) or **shadow** (mirror traffic, don't serve responses) so you validate on real traffic before full cutover. Wire **automated rollback**: if a live metric (latency, error rate, or a business KPI / online quality proxy) regresses past a threshold, revert to the previous registry version automatically.

**How it differs from software CI/CD:** the artifact set is code + data + model, not just code; tests include statistical data/model checks, not only deterministic assertions; the "build" is a training run that's expensive and non-deterministic; and validation continues *after* deploy via monitoring and drift detection, feeding back into retraining.

**Key points:**
- Version code + data (DVC) + config for full reproducibility and lineage.
- Automated evaluation gate: must beat baseline / pass threshold before promotion.
- Model registry drives staging→production; canary/shadow deploy with automated rollback.
- Differs from software CI/CD: data + model are artifacts; tests are statistical; validation continues post-deploy.

---

### 84. Diffusion vs GANs vs autoregressive image models

**Frequency:** Low

**Question:** Compare diffusion, GANs, and autoregressive image models. How do one-step methods close the gap?

**Answer:** Three paradigms for generating images, trading off **training stability, inference speed, and quality**:

**GANs** — a generator produces an image in a **single forward pass**, so inference is **fast** and images are sharp. But the adversarial training is **unstable** and prone to **mode collapse** (ignoring parts of the data distribution). Great speed, hard to train.

**Diffusion** — generate by **iteratively denoising** over many steps. Inference is **slow** (dozens to hundreds of forward passes), but training is a **simple, stable** regression loss, it gives **broad mode coverage** (diverse outputs), and it's **controllable** via classifier-free guidance. This combination makes it the **current SOTA** for fidelity and diversity.

**Autoregressive image models** (DALL-E 1, Parti, MAR) — treat an image as a **sequence of discrete tokens** (from a VQ-VAE codebook) and **predict them one at a time like a language model**. This scales cleanly with transformers and **unifies naturally with text**, making it attractive for multimodal foundation models — but generation is **sequential** (slow, quadratic) and unidirectional.

**Closing the inference gap:** the big weakness of diffusion is its many-step sampling. New methods aim for **one- or few-step** generation with diffusion-level quality: **consistency models** (train the network to jump directly to the final image), **flow matching**, and **rectified flow** (learn straight-line trajectories that need few steps). These blend diffusion's stability with GAN-like speed.

**In production:** **Stable Diffusion / SDXL / SD3** for cheap open-weight image generation, **DALL-E 3 / Midjourney** for top closed-source quality, and **autoregressive** approaches for unified multimodal models (generating text and images in one transformer).

**Key points:**
- GAN: fast, unstable.
- Diffusion: slow, stable, current SOTA.
- AR: scales like LLMs, easy multimodal unification.
- One-step diffusion (consistency/rectified flow) closes the inference gap.

---

### 85. DPO and preference optimization variants

**Frequency:** Low

**Question:** Explain DPO and preference optimization variants. Why did DPO largely replace PPO for open-source alignment?

**Answer:** **Direct Preference Optimization (DPO)** achieves the same goal as RLHF — aligning a model to human preferences — but **without the reinforcement learning machinery**. The insight is a mathematical reformulation: RLHF's "train a reward model, then optimize it with PPO" can be collapsed into a **single classification loss** directly on the preference data.

Given preference pairs of **(chosen, rejected)** responses, DPO optimizes the model to assign **higher relative likelihood to the chosen response**, with an **implicit KL penalty** to a frozen reference model (the SFT model) baked into the loss so the policy doesn't drift too far. There is **no separate reward model, no PPO, no sampling rollouts** — just gradient descent on a closed-form objective over a static dataset.

**Why it won:** the RLHF pipeline is **complex and unstable** — you train and serve a reward model, run PPO with online generation, and tune many knobs. DPO is **faster, simpler, and far more stable**, yet **often matches PPO quality**. Critically, it's cheap enough to run on **consumer hardware with LoRA**, which democratized alignment for the open-source community — the main reason it became dominant in 2024–2025.

**Variants refine specific weaknesses:**
- **IPO** — fixes DPO's tendency to **overfit** to preferences when they're deterministic.
- **KTO** — uses **unpaired binary feedback** (thumbs up/down) instead of requiring ranked pairs, easier to collect.
- **ORPO** — combines **SFT and preference optimization into one step**, skipping the separate SFT stage.
- **SimPO** — removes the need for a **reference model** entirely, simplifying further.

**Where PPO still holds:** truly **online** settings and **process supervision** (rewarding intermediate reasoning steps), where you need to score fresh generations rather than a fixed preference dataset.

**Key points:**
- Closed-form preference loss; no RL.
- Faster, simpler, comparable to PPO.
- IPO/KTO/ORPO/SimPO are practical improvements.
- Now dominant for open-source LLM alignment.

---

### 86. Attention scaling: FlashAttention, sparse, linear

**Frequency:** Low

**Question:** Discuss attention scaling techniques for long sequences. How does FlashAttention differ from sparse/linear attention?

**Answer:** Vanilla self-attention is **`O(n²)`** in both compute and memory because it forms the full `n×n` attention matrix — every token attends to every other. At long sequence lengths this is the wall. Techniques to scale it fall into two philosophically different camps.

**FlashAttention — same math, smarter execution.** It doesn't approximate anything; it computes **exact** attention but reorganizes *how*. The key realization is that attention is **memory-bandwidth-bound**, not compute-bound — the bottleneck is shuffling the giant `n×n` matrix to and from slow GPU HBM. FlashAttention uses **tiling** (process the matrix in blocks that fit in fast on-chip SRAM) and **recomputation** (recompute values in the backward pass rather than storing them), so it **never materializes the full matrix**. Result: **2–4× speedup** and memory that scales **linearly** instead of quadratically, with **identical outputs**. It's now the standard kernel in PyTorch/CUDA. This is the free lunch — no quality tradeoff.

**Approximate methods — change the math to cut complexity** (at some quality cost):
- **Sparse attention** (BigBird, Longformer) — each token attends only to a **local window plus a few global tokens** instead of everything, giving sub-quadratic cost. Loses some ability to model arbitrary long-range pairs.
- **Linear attention** (Performer, Linformer) — approximate the softmax with **kernel features** or low-rank projections for genuine `O(n)` cost. Fast, but quality often lags full attention.

**Architectural alternatives — replace attention entirely:** **State-Space Models** (Mamba, Mamba-2) use a **selective recurrence** that trains in **linear time** and matches transformer quality on language, while **hybrid** models (Jamba, Zamba) interleave attention and SSM layers to get the best of both. The field is actively shifting toward these **sub-quadratic** designs for very long contexts.

**Key points:**
- FlashAttention: same math, IO-aware, 2-4x faster.
- Sparse/linear attention reduce complexity but lose quality.
- Mamba/SSMs are emerging linear alternatives.
- Hybrid architectures are practical compromises.

---

### 87. MQA and GQA: efficient KV

**Frequency:** Low

**Question:** Explain MQA and GQA. Why are they critical for long-context inference?

**Answer:** Standard **multi-head attention (MHA)** gives every head its own **Query, Key, and Value** projections — `h` Q heads, `h` K heads, `h` V heads. The problem shows up at **inference**: autoregressive generation caches the K and V for every past token (the **KV cache**), and with `h` separate K/V heads that cache is huge, dominating memory and — more importantly — **memory bandwidth**, which is the real bottleneck for generation speed.

**Multi-Query Attention (MQA)** (Shazeer, 2019) keeps the `h` separate **Query** heads but shares a **single K and single V** across all of them. This shrinks the KV cache by roughly **`h`-fold**, drastically cutting memory and bandwidth so decoding is much faster. The catch: collapsing all K/V into one head costs a **small amount of quality** and can destabilize training.

**Grouped-Query Attention (GQA)** is the **middle ground** that fixes MQA's downside. Instead of 1 or `h` K/V heads, it uses **`g` groups** — several Q heads share each K/V head (`g = h / group_size`). For example **LLaMA-2/3** use **8 K/V heads** with 32 or 64 Q heads. This recovers **most of MQA's speed/memory savings with almost no quality loss**, which is why GQA is now standard in essentially every modern open LLM (LLaMA, Mistral).

**Why it's critical for long context:** as sequences grow, the **KV cache grows linearly and comes to dominate memory** — at long context it dwarfs the weights. Reducing K/V heads is the most direct lever on that cost, making long-context serving economically viable. A useful practical note: you can **convert a pretrained full-MHA model to GQA post-hoc** by mean-pooling K/V heads and doing **light fine-tuning**, rather than retraining from scratch.

**Key points:**
- MQA: single K/V shared; cuts cache ~h-fold.
- GQA: groups K/V heads; sweet spot.
- Standard in LLaMA-2/3, Mistral, modern LLMs.
- Critical for long-context inference economics.

---

### 88. Long-context techniques

**Frequency:** Low

**Question:** Discuss long-context techniques for LLMs. Why is effective context often shorter than the headline length?

**Answer:** Getting an LLM to handle long inputs is hard because **pretraining at long sequence length is expensive** — attention is `O(n²)`, so training natively at 128k tokens costs far more than at 4k. So most long-context ability is added by **extending** a model trained at short length, plus **inference tricks**.

**Extension strategies (stretch a 4k/8k model with brief fine-tuning):**
- **Position interpolation** — linearly **rescale RoPE positions** so positions beyond the training range map into the range the model already understands.
- **NTK-aware scaling** — interpolate in the **frequency domain** rather than linearly, preserving high-frequency detail; better quality than naive interpolation.
- **YaRN** — refines NTK scaling with an attention-temperature adjustment; the current go-to for extending context to 32k–128k+ with only light fine-tuning.

**Streaming / inference-side techniques:**
- **Sliding-window attention** (Mistral) — attend only to recent K/V, capping cost for long streams.
- **Attention sinks** (StreamingLLM) — keep the **first few tokens** permanently in the window; they act as an attention "bias" that stabilizes the model when old tokens are evicted.
- **Prompt caching** — reuse a shared prefix's KV cache across requests.
- **Chunked prefill** — process a long prompt in batches to manage memory.

**Architectural alternatives:** **SSMs** (Mamba) and **hybrids** (Jamba) with linear-time cost, or **RAG** to keep the *needed* context short instead of stuffing everything in.

**Why effective < headline context:** even models advertising **1M+ tokens** often can't reliably *use* information buried deep in the middle — the **"lost in the middle"** problem, where models attend well to the **beginning and end** of the context but poorly to the middle. So a 128k-token model may only reason robustly over a much smaller effective span. This is a key reason **RAG frequently beats stuffing everything into context**: retrieving the few relevant chunks and placing them prominently is more reliable (and cheaper) than dumping a huge document and hoping the model finds the needle.

**Key points:**
- RoPE scaling (YaRN/NTK) extends pretrained models.
- Sliding window + attention sinks for streaming.
- "Lost in the middle" is a real quality cliff.
- RAG often beats stuffing everything into context.

---

### 89. Chunking strategies for RAG

**Frequency:** Low

**Question:** Discuss chunking strategies for RAG. How do parent-document retrieval and late chunking help?

**Answer:** Chunking — how you split documents into retrievable pieces — is one of the highest-leverage decisions in RAG, because you can only retrieve and ground on what your chunks contain. The core tension: **small chunks retrieve precisely but lose surrounding context; large chunks carry context but dilute relevance** (the embedding averages over too much) and waste prompt tokens.

**The main strategies, roughly increasing in sophistication:**
- **Fixed-size** — split every N tokens/characters. Simple but blindly cuts through sentences and ideas.
- **Recursive splitting** — try to split on paragraph boundaries, fall back to sentences, then characters. Respects structure while capping size; a common default.
- **Semantic chunking** — split where **embedding similarity drops** between consecutive sentences, so each chunk is topically coherent.
- **Structural** — split on **headings, sections, code blocks**, using the document's own structure.
- **Document-specific** — tailored handling for LaTeX, code, tables, etc.

**Typical settings:** **200–1000 tokens** per chunk with **10–20% overlap** so an idea straddling a boundary isn't severed. Attach **metadata** (source, section, date) to every chunk for **filtering** and **citations**.

**Two advanced techniques that break the precision-vs-context tradeoff:**
- **Parent-document retrieval** — **embed and match on small, precise chunks**, but **return the larger surrounding parent** section to the LLM. You get precise retrieval *and* rich context.
- **Late chunking** (Jina) — **embed the whole document first** (so every token's embedding is informed by the full context), *then* pool token embeddings into chunk vectors. Each chunk vector thus carries **global context** it would lack if embedded in isolation.

Getting chunking right often moves RAG quality more than any model swap.

**Key points:**
- Recursive or semantic chunking beats naive splits.
- Overlap (10-20%) prevents context cuts.
- Parent-doc retrieval bridges precision/context tradeoff.
- Metadata enables filtering and citations.

---

### 90. Reranking in RAG

**Frequency:** Low

**Question:** Explain reranking in RAG. Why do cross-encoders outperform bi-encoder similarity?

**Answer:** Reranking is a **two-stage retrieval** pattern: a fast-but-coarse first stage fetches many candidates, then a slower-but-accurate **reranker** re-scores them to surface the truly relevant ones. It exists because the initial vector search optimizes for **speed at scale**, not precision.

**Why the first stage is coarse:** vector search uses a **bi-encoder** — the query and each document are embedded **independently** into fixed vectors, and relevance is their **cosine similarity**. This is fast (you precompute all doc embeddings and just do nearest-neighbor lookup) but **lossy**: compressing a document into one vector *before* it ever sees the query means the model can't focus on the query-specific details, so it struggles to distinguish finely-relevant from merely-topical results.

**Why cross-encoders win:** a **cross-encoder reranker** (BGE-reranker, Cohere Rerank) takes the **(query, document) pair jointly as one input**, letting attention flow **between** query and document tokens to produce a single relevance score. Because it can directly model **how the query relates to each specific passage**, it's far more accurate at fine distinctions. The tradeoff is cost: it must run a full forward pass **per candidate**, so it can't scan millions of docs — only re-rank a shortlist.

**The typical pipeline:** retrieve a **broad top-50/100** via **hybrid vector + BM25** search (high recall), then **rerank** those with the cross-encoder and keep the **top-5/10** for the LLM (high precision). Retrieve broad, rerank narrow.

**Cost vs value:** reranking adds latency (~tens of ms per candidate), but it's frequently the **highest-ROI improvement** in a RAG system after retrieval itself — it fixes the common failure where the right doc *was* retrieved but ranked too low to make the context window. Options: open-source (BGE-reranker, mxbai, Jina), hosted (Cohere, Voyage), or an **LLM-as-reranker** (accurate but expensive).

**Key points:**
- Cross-encoder more accurate than embedding similarity.
- Retrieve broad, rerank narrow.
- Often the highest-ROI RAG improvement.
- Adds latency but big precision wins.

---

### 91. Hybrid search: vector + lexical

**Frequency:** Low

**Question:** Explain hybrid search (vector + lexical). Why is it the production default for RAG?

**Answer:** Hybrid search combines **dense vector search** with **lexical (keyword) search** because each alone has a blind spot that the other covers.

- **Pure vector search** captures **semantic meaning** — it finds "car" for a query about "automobile" — but it **misses exact matches**. Rare tokens like acronyms, product names, error codes, identifiers, and part numbers get blurred into their embedding neighborhood, so a query for `ERR_5023` might not retrieve the doc that contains exactly `ERR_5023`.
- **Pure lexical search (BM25)** nails **exact token matches** but is **blind to semantics** — it won't connect "heart attack" to "myocardial infarction" if the words differ.

**Combining them** requires fusing two different score scales. The common methods:
- **Reciprocal Rank Fusion (RRF)** — combine by **rank position** rather than raw scores (`sum of 1/(k + rank)`), which sidesteps the score-normalization problem entirely. It's **simple, parameter-free, and often the best in practice**.
- **Weighted normalized scores** — normalize each system's scores and take a weighted sum (needs tuning).

**Why it's the production default:** **real queries mix both kinds of intent** — a user searching "how to fix ERR_5023 timeout" wants the **exact error code** (lexical) *and* the **concept** of timeouts (semantic). Hybrid captures both, and is **essentially always better than vector alone** in production for **modest infrastructure overhead**. Most engines support it natively (Elasticsearch/OpenSearch, Weaviate, Qdrant, Vespa, Milvus).

**A middle-ground alternative** is **ColBERT** (late interaction): it stores a vector **per token** and does fine-grained **token-level matching** at query time, blending lexical precision with semantic flexibility at close to bi-encoder efficiency.

**Key points:**
- Vector for semantics, BM25 for exact tokens.
- RRF is a simple, strong fusion.
- Production default for serious RAG.
- ColBERT: token-level late interaction.

---

### 92. Canary deployment and shadow mode

**Frequency:** Low

**Question:** Explain canary deployment and shadow mode. Why do these matter especially for ML?

**Answer:** Both are **risk-reduction patterns** for rolling out a new model, letting you validate it against **real production traffic** before fully trusting it.

**Shadow mode** runs the new model **in parallel** with the current one: production requests are sent to **both**, but only the current model's predictions are served to users — the new model's outputs are **logged, not used**. You then compare offline. This has **zero user impact** and catches **infrastructure bugs** (does it even run at production load and latency?) and **gross distribution shifts** (are outputs wildly different?), all before a single user sees the new model.

**Canary deployment** goes a step further: route a **small percentage** of real traffic (1% → 5% → 25%) to the new model, **monitor** business and guardrail metrics, and **ramp up** if healthy or **roll back fast** if not. Now the new model *is* serving users, but only a limited blast radius. **Feature flags** give granular control over who gets routed where, and you build **automated rollback** that triggers on regression of key metrics.

**Why these matter especially for ML:** traditional software either works or throws an error, but **models fail silently and subtly** — they return confident, well-formed predictions that are simply **wrong** for some slice of the input distribution. Offline evaluation can't catch this because production data always differs from your test set in ways you didn't anticipate (new user segments, data drift, edge cases). Shadow and canary expose the model to **real, live distribution** where these failures actually surface.

**How they pair with A/B testing:** shadow/canary answer **"is it safe and does it work in production?"** (operational validation); A/B testing answers **"is it statistically better?"** (does it move the business metric). You typically shadow → canary → full A/B → rollout.

**Key points:**
- Shadow: log only, no user impact.
- Canary: small live traffic with auto-rollback.
- Feature flags + metrics + rollback automation.
- Catches what offline eval misses.

---

### 93. LLM inference engines: vLLM, TGI, TensorRT-LLM

**Frequency:** Low

**Question:** Explain LLM inference engines (vLLM, TGI, TensorRT-LLM). What core features make them fast?

**Answer:** These are **specialized servers** for high-throughput LLM inference — naive `model.generate()` in a loop wastes the GPU badly, and these engines recover that lost throughput, often by **10× or more**.

**The key ideas they share:**
- **Continuous batching** — the single biggest win. Instead of static batches (where the whole batch waits for the slowest sequence to finish), sequences are **inserted and removed from the batch as they complete**, keeping the GPU saturated. No idle waiting.
- **Paged KV cache** — vLLM's flagship **PagedAttention** treats the KV cache like **OS virtual-memory pages**: non-contiguous fixed-size blocks instead of one big pre-allocated buffer. This slashes **memory fragmentation** (you no longer over-allocate for the max possible length), letting you fit far more concurrent sequences — vLLM reported **2–24×** throughput gains.
- **Prefix caching** — reuse the KV cache of a **shared prefix** (e.g., a long system prompt repeated across every request), avoiding recomputation. Huge for chat apps.
- **Quantization** (INT8/FP8/INT4), **speculative decoding**, and **multi-LoRA serving** (serve many fine-tuned adapters on one base model).

**The main engines:**
- **vLLM** — origin of PagedAttention; the **open-source default** for most teams, easy to run, broad model support.
- **TGI** (Hugging Face Text Generation Inference) — comparable production server, well integrated with the HF ecosystem.
- **TensorRT-LLM** (NVIDIA) — **compiles** the model with kernel fusion, quantization, and graph optimization for **maximum GPU throughput** on NVIDIA hardware, at the cost of a heavier build step.
- **SGLang** — adds **RadixAttention** for aggressive **prefix sharing** across requests, strong for complex prompting/agent workloads.

**Choosing:** vLLM for a fast, flexible default; TensorRT-LLM when squeezing peak NVIDIA performance justifies the compilation complexity.

**Key points:**
- Continuous batching + paged KV = throughput multiplier.
- vLLM dominant open-source choice.
- TensorRT-LLM for max NVIDIA performance.
- Prefix caching huge for repeated system prompts.

---

### 94. Speculative decoding

**Frequency:** Low

**Question:** Explain speculative decoding. Why is the output distribution unchanged, and when does it help most?

**Answer:** Speculative decoding speeds up LLM generation by exploiting a gap: generation is **memory-bandwidth-bound**, so a single large-model forward pass can **verify several tokens at once nearly as cheaply as generating one**. The trick uses a small, fast **draft model** to guess ahead, then the big model to check the guesses.

**The mechanism:**
1. A small **draft model** cheaply proposes the next **K tokens** (e.g., 4–5) autoregressively.
2. The large **target model** runs **one forward pass** over all K proposed tokens **in parallel**, producing its own probability for each position.
3. A **verification/acceptance step** accepts the longest prefix of drafted tokens that the target model "agrees" with, and **corrects the first disagreement** from the target's own distribution.

Accepted tokens essentially came **free** (they rode along in one target pass); a rejection costs no more than a normal generation step. Net effect: **2–4× speedup** when the draft model is decent.

**Why the output distribution is unchanged:** the acceptance rule is a **rejection-sampling scheme** mathematically constructed so the accepted tokens follow **exactly the target model's distribution**. The draft model only proposes; it can never change *what* the target would have produced — only *how fast*. So output is **identical** to sampling directly from the target (bit-for-bit for greedy). This is the crucial property: pure speedup, **zero quality cost**.

**When it helps most:** **low-latency, low-batch, interactive** serving — exactly the memory-bound regime where the GPU has spare compute. It shows **diminishing returns at high batch sizes**, where the GPU is already compute-saturated and no longer latency-bound.

**Variants:** **Medusa** (extra decoding heads propose a *tree* of candidates, no separate draft model), **self-speculative** (use the model's own early layers as the draft), and **EAGLE** (stronger draft heads fed the target's hidden states). Now standard in vLLM, TensorRT-LLM, and major inference APIs.

**Key points:**
- Draft small, verify big; same output distribution.
- 2-4x speedup typical, no quality loss.
- Medusa/EAGLE are stronger variants.
- Best at low batch (latency-bound).

---

### 95. Continuous batching and paged attention

**Frequency:** Low

**Question:** Explain continuous batching and paged attention. Why do they together yield 10x+ throughput?

**Answer:** These are the two core techniques that made modern LLM serving economical, each fixing a different source of waste in naive serving.

**The problem with static batching:** classic batched inference groups requests together and **pads them all to the longest sequence**, then processes the whole batch in lockstep. For LLM generation this is doubly wasteful because **sequences finish at wildly different lengths** — one request generates 10 tokens, another 500. With static batching, the GPU keeps processing the finished 10-token request (doing nothing useful) until the 500-token one completes, and short requests can't leave to make room for new ones. Utilization craters.

**Continuous batching** (Orca, vLLM) fixes the time dimension: it operates at the **per-token (iteration) level**. After **every** generation step, finished sequences are **evicted** and **new waiting requests are slotted into the batch immediately**. The GPU never idles on completed sequences and never makes new requests wait for a whole batch to drain. This is the biggest utilization win for **variable-length** generation.

**Paged attention** fixes the memory dimension. The KV cache normally needs a **contiguous** buffer sized for each sequence's max possible length, causing massive **fragmentation and over-allocation**. PagedAttention instead stores the KV cache in **fixed-size pages** (exactly like OS virtual memory), allocated **on demand** as the sequence grows. This nearly eliminates fragmentation — packing far more concurrent sequences into the same GPU memory — and enables **prefix sharing**: requests with a common prefix (shared system prompt, few-shot examples) can **point to the same physical pages** instead of duplicating them.

**Why together = 10x+:** continuous batching keeps the compute units busy while paged attention lets you fit many more sequences in memory to feed them. Compute saturation + memory efficiency compound. They're now **standard** in vLLM, SGLang, TGI, and TensorRT-LLM.

**Key points:**
- Continuous batching: no idle GPU on short sequences.
- Paged KV: no fragmentation, prefix sharing.
- 10x+ throughput vs naive serving.
- Both standard in modern LLM servers.

---

### 96. Model distillation for production

**Frequency:** Low

**Question:** Explain model distillation for production. Why does task-specific distillation often beat generic, and what's a practical recipe?

**Answer:** Distillation compresses a large, expensive **teacher** model into a small, cheap **student** that runs in production. The core idea is to train the student not just on hard labels but on the teacher's **richer signal**.

**The approaches, in order of specificity:**
- **Standard logit-matching KD** — train the student to match the teacher's **full softened probability distribution** (logits with temperature), not just the top answer. The "dark knowledge" in the teacher's relative probabilities ("this is 70% cat, 25% dog, 5% fox") teaches the student more than a one-hot label.
- **Sequence-level distillation** — train the student on the teacher's **generated output sequences**, matching behavior rather than per-token logits.
- **Task-specific distillation** — distill the teacher **only on your task's data distribution**.

**Why task-specific wins:** a generic student tries to replicate the teacher **everywhere**, spreading its limited capacity across the teacher's entire (enormous) capability surface. A task-specific student only needs to reproduce the teacher **on your narrow slice**, so its small capacity is spent exactly where it matters — it can match or nearly match the teacher **on that task** despite being far smaller. You don't need a 400B model's general knowledge to classify your support tickets.

**LLM distillation in practice** typically means **synthetic data generation**: prompt a frontier model (GPT-4, Claude) to produce high-quality outputs on your domain, then **fine-tune a small open model** (Llama-3-8B, Mistral, Qwen) on those input–output pairs. **Licensing caveat:** several providers' terms of service **prohibit using their outputs to train competing models** — check before doing this commercially.

**Practical recipe (the dominant productionization path):** distill frontier-model outputs on your domain into **Llama-3-8B with LoRA**, then stack **quantization** (INT4) and optionally **pruning** for max compression. Result: **~90% of frontier quality at ~1% of the cost**, deployable on a single GPU.

**Key points:**
- Task-specific distillation beats generic.
- Synthetic data from frontier → small student.
- Watch provider TOS on outputs.
- Stack with quantization for max compression.

---

### 97. Edge and on-device ML

**Frequency:** Low

**Question:** Explain edge and on-device ML. What are the key techniques and tradeoffs?

**Answer:** Edge/on-device ML runs models directly on phones, browsers, and embedded devices instead of calling a cloud server. The defining reality is a **severe resource budget**: limited RAM, weak compute, a battery to conserve, often **no GPU**, and thermal limits that throttle sustained work.

**The software stack** bridges trained models to constrained runtimes: **TensorFlow Lite** and **ONNX Runtime** (cross-platform), **Core ML** and **Apple Foundation Models** (iOS), **MediaPipe**, and for LLMs specifically **llama.cpp** and **MLC-LLM**, plus vendor accelerators like the **Qualcomm AI Engine** (NPUs).

**The techniques** all aim to shrink the model to fit and run within budget:
- **Quantization** — the workhorse. INT8/INT4 (sometimes binary) cuts memory and speeds inference several-fold.
- **Pruning** — remove weights; **structured** pruning maps to real hardware speedups.
- **Distillation** — compress a big teacher into a small student.
- **Mobile-optimized architectures** — MobileNet, EfficientNet, MobileBERT designed for the budget.
- **Hardware-targeted NAS** — search architectures optimized for the *specific* device.

The headline development: **1–8B-parameter LLMs at INT4 now fit in phone RAM** — Phi-3-mini, Gemma 2B, Llama 3.2 1B/3B run locally.

**Benefits vs challenges:** on-device gives **privacy** (data never leaves the device), **offline** operation, **low latency** (no network round-trip), and **zero per-request cost**. Against that: strict **model-size** limits, **thermal throttling** under load, and **OS/hardware fragmentation** (every device is different). The 2025–2026 trend is **hybrid cloud-edge routing** — handle simple/private queries on-device, escalate hard ones to the cloud.

**Key points:**
- Tight memory/compute/battery budgets.
- Quantization + small architectures essential.
- 1-8B LLMs viable on modern phones.
- Privacy + offline are key advantages.

---

### 98. GPU efficiency and training cost

**Frequency:** Low

**Question:** Discuss GPU efficiency and training cost. What are the key optimizations and what is MFU?

**Answer:** Training cost is essentially **compute ÷ effective throughput**. A useful mental model: `cost ≈ (model FLOPs per token × tokens) / (GPU peak FLOPs × utilization)`. The numerator is fixed by your model size and dataset; the game is maximizing the denominator — keeping expensive GPUs actually doing useful math rather than waiting on memory or communication.

**The modern optimization stack:**
- **Mixed precision** (FP16/BF16/FP8) — compute in lower precision for **2–4× speedup** and half the memory; BF16 is the training default, FP8 emerging on H100/H200.
- **Gradient checkpointing** — don't store all activations; **recompute** them in the backward pass. Trades extra compute for large memory savings, enabling bigger models/batches.
- **ZeRO / FSDP** — **shard** the optimizer states, gradients, and parameters **across GPUs** so no single GPU holds the whole model. Essential for large models.
- **Parallelism** — **data** (replicate model, split batch), **tensor** (split individual layers across GPUs), **pipeline** (split layers into stages across nodes); large runs combine all three ("3D parallelism").
- **FlashAttention** — memory-efficient exact attention (tiling + recomputation).
- **Gradient accumulation** — simulate a large batch by summing gradients over several micro-batches before stepping.

**MFU (Model FLOPs Utilization)** is the headline efficiency metric: the fraction of the GPU's theoretical peak FLOPs your training actually achieves on *useful* model math. **Typical transformer training runs hit 40–55%** — the rest is lost to memory movement, communication, and pipeline bubbles. Higher MFU directly means lower cost, and at frontier scale (campaigns costing tens to hundreds of millions of dollars) every point compounds.

**Chinchilla scaling laws** guide the *strategic* choice: for a fixed compute budget, balance **model size vs training tokens** (~20 tokens per parameter) rather than just making the model bigger — compute-optimal allocation. **Inference-side** levers are separate: quantization, batching, paged attention, speculative decoding, and multi-LoRA serving, where **KV cache and batching** dominate cost.

**Key points:**
- BF16/FP8 + FlashAttention + FSDP = modern stack.
- MFU is the headline efficiency metric.
- Chinchilla: balance params vs tokens.
- Inference cost dominated by KV/batching/quantization.

---

### 99. AI alignment

**Frequency:** Low

**Question:** Explain AI alignment. What are outer vs inner alignment, and why is scalable oversight hard?

**Answer:** Alignment is the problem of ensuring AI systems **pursue what humans actually want** — not a corrupted proxy of it. It splits into distinct, hard subproblems.

**Outer alignment — specifying the right objective.** Can we even write down what we want? Human values are complex and hard to capture in a reward function; naive objectives get **gamed** (reward hacking). Techniques attack the specification problem: **reward modeling** (learn a reward from human preferences instead of hand-coding it), **constitutional AI** (the model critiques and revises its own outputs against a written set of principles, reducing reliance on human labels), and **debate** (two AIs argue opposing sides so a human judge can spot flaws).

**Inner alignment — does the model actually optimize what we specified?** Even with a correct objective, a model trained by gradient descent may internally develop its **own** goals (a **mesa-optimizer**) that merely *correlate* with the training objective on the training distribution but diverge off-distribution. The nightmare case is **deceptive alignment**: a model that *knows* it's being evaluated behaves well during training/testing while harboring a different objective it pursues once deployed. This is hard to detect precisely because the behavior looks aligned.

**Scalable oversight — the crux for advanced systems.** Today we align models partly by having humans **evaluate** their outputs. But once models produce **superhuman** work — code, proofs, plans no human can fully verify — humans **can't reliably judge** whether the output is good or subtly wrong. So how do you supervise something smarter than you? Research directions: **AI-assisted evaluation**, **debate**, **recursive reward modeling**, and **weak-to-strong generalization** (can a weak supervisor still elicit aligned behavior from a strong model?).

**Practical tools today:** **RLHF**, **DPO**, **constitutional AI**, **red-teaming**, and **evals** — all frontier labs (Anthropic, OpenAI, DeepMind, Meta) run alignment teams. **Open problems:** deceptive alignment, corrigibility (will the system let us correct/shut it down?), goal preservation, and interpretability (reading a model's internals to verify its objectives). The stakes rise sharply as models become **agentic** — capable of taking consequential real-world actions autonomously.

**Key points:**
- Outer (spec) + inner (optimization) alignment.
- RLHF/DPO/constitutional AI are practical tools.
- Scalable oversight is an open research area.
- Stakes rise with autonomy and capability.

---

### 100. LLM benchmarks: MMLU, HellaSwag, HumanEval, MATH

**Frequency:** Low

**Question:** Discuss major LLM benchmarks (MMLU, HellaSwag, HumanEval, MATH). Why are many saturated, and why should your own eval outrank them?

**Answer:** Public benchmarks are standardized tests that track LLM capability and let models be compared — but they age quickly and each measures something narrow.

**The classic (now largely saturated) benchmarks:**
- **MMLU** — multiple-choice knowledge across **57 subjects** (law, medicine, math…). Frontier models now score **90%+**, so it barely separates them anymore.
- **HellaSwag** — commonsense sentence completion. Saturated.
- **GSM8K** — grade-school math word problems. Saturated.
- **HumanEval / MBPP** — generate a Python function from a docstring; also getting saturated.

**"Saturated"** means top models cluster near the ceiling, so the benchmark can no longer discriminate — differences fall within noise. That drives the field toward **harder benchmarks that still separate frontier models:**
- **SWE-Bench** — fix **real GitHub issues** in real repos; far harder and more realistic than toy functions.
- **MATH / AIME** — competition-level math, where **reasoning models** (o1, R1) with long chain-of-thought pull ahead.
- **GPQA** — **graduate-level** science questions written to be Google-proof.
- **ARC-AGI** — abstract visual reasoning, deliberately hard for LLMs.
- **MT-Bench / Arena Hard / Chatbot Arena** — measure **chat quality** via human or LLM judgment rather than fixed answers.

**The core problems** are **contamination** — benchmark questions leak into training data, inflating scores without real capability — and **benchmark-overfitting** — labs tune toward popular benchmarks, so a high score reflects the benchmark more than general ability. **Live leaderboards** (LMSys **Chatbot Arena**, **LiveBench**, **SimpleBench**) fight this with **fresh, rotating prompts** that can't be memorized in advance.

**Why your own eval wins:** public benchmarks measure **generic** ability on **someone else's** distribution. What actually matters is performance on **your** task, **your** data, **your** failure modes — and a model can top MMLU while failing your specific use case (and vice versa). Always **trust a well-built application-specific eval over any public benchmark** when choosing a model for production.

**Key points:**
- MMLU, HellaSwag, GSM8K largely saturated.
- SWE-Bench, MATH, GPQA still discriminate frontier models.
- Contamination + benchmark-overfitting are real.
- Your custom eval > public benchmarks.
