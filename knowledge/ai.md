# AI & Machine Learning Questions

100 high-frequency interview questions covering machine learning fundamentals, deep learning, NLP, LLMs, generative AI, MLOps, model serving, evaluation, and AI systems engineering.

---

### 1. Bias-variance tradeoff

**Answer:** Generalization error decomposes into bias (error from wrong model assumptions, underfitting), variance (sensitivity to training-set fluctuations, overfitting), and irreducible noise. High-bias models like linear regression on nonlinear data systematically miss the signal; high-variance models like a deep tree on small data memorize noise. The tradeoff is managed via model capacity, regularization (L1/L2, dropout, early stopping), more data (reduces variance), or ensembling (bagging cuts variance, boosting cuts bias). Diagnose by comparing train vs validation error: large gap = variance problem; both high = bias problem. Modern overparameterized networks complicate the classical U-curve via double descent, but the framing still guides everyday model selection and debugging.

**Key points:**
- Train/val gap diagnoses bias vs variance.
- Regularization and more data reduce variance.
- Increase capacity or features to reduce bias.
- Double descent appears in overparameterized regimes.

---

### 2. Overfitting and how to prevent it

**Answer:** Overfitting is when a model captures training noise instead of underlying patterns, yielding low train error but high test error. Causes: too much capacity relative to data, too many features, training too long, leaky validation, or imbalanced classes letting the model exploit shortcuts. Mitigations: more or better data, augmentation, simpler models, L1/L2 weight decay, dropout, early stopping, cross-validation for honest estimates, batch normalization, label smoothing, and ensembling. In deep learning, data augmentation and dropout are first-line defenses; in classical ML, regularization and feature selection dominate. Always reserve a held-out test set untouched until final evaluation, and watch the train-val curve diverge as the canonical overfitting signal.

**Key points:**
- Train low, validation high = overfit.
- Regularization, dropout, early stopping are core tools.
- More/cleaner data beats clever tricks.
- Never tune on the test set.

---

### 3. Train/validation/test split and cross-validation

**Answer:** Split data into training (fit parameters), validation (tune hyperparameters and pick models), and test (single final unbiased estimate). Typical ratios: 70/15/15 or 80/10/10 for large data; use k-fold cross-validation (k=5 or 10) when data is scarce so every example is used for both train and val. Stratify on the label for classification to preserve class ratios. For time series use forward-chaining (rolling window) splits—never random—since past must predict future. For grouped data (multiple rows per user), split by group to prevent leakage. Reuse of the test set for decisions silently leaks information; if you must iterate, hold out a fresh test set later.

**Key points:**
- Test set is touched once, at the end.
- Stratify classification; time-order time series.
- Group-aware splits prevent user-level leakage.
- k-fold for small data; holdout for large data.

---

### 4. Cross-validation strategies

**Answer:** k-fold splits data into k equal partitions, training on k-1 and validating on the held-out fold, averaging metrics across folds. Stratified k-fold preserves class distribution per fold and is the default for classification. Leave-one-out (LOO) is k=n; high variance and expensive but unbiased for small data. Repeated k-fold averages across multiple random partitions to stabilize estimates. Nested CV uses an outer loop for evaluation and inner loop for hyperparameter search to avoid optimistic bias when both are needed. For time series, use TimeSeriesSplit (expanding or sliding window). Group k-fold respects group boundaries (e.g., per-patient). Pick the scheme that matches the data's dependency structure and the question you're answering.

**Key points:**
- Stratified k-fold is the safe default for classification.
- Nested CV for honest hyperparameter selection.
- Time series needs forward-chaining splits.
- Group-aware folds avoid leakage in clustered data.

---

### 5. Regularization: L1 vs L2 vs elastic net

**Answer:** L2 (ridge) adds lambda * sum(w^2) to the loss, shrinking weights smoothly toward zero, handling multicollinearity well, and yielding stable closed-form solutions. L1 (lasso) adds lambda * sum(|w|), which drives some weights exactly to zero, performing implicit feature selection and producing sparse models. Elastic net combines both with mixing parameter alpha, getting L1's sparsity plus L2's stability and the ability to select groups of correlated features (L1 alone arbitrarily picks one). Choose L2 for dense signals and stable predictions, L1 when you want sparsity or interpretability, elastic net when features are correlated. In neural networks L2 (weight decay) is standard; AdamW decouples it from adaptive gradients for cleaner behavior.

**Key points:**
- L1 = sparsity; L2 = shrinkage; elastic net = both.
- L1 picks arbitrarily among correlated features.
- AdamW decouples weight decay from adaptive steps.
- Lambda tuned by cross-validation.

---

### 6. Feature engineering and feature selection

**Answer:** Feature engineering creates predictive signals from raw data: encoding categoricals (one-hot, target, embedding), scaling numerics, binning, interactions, polynomial expansions, log/Box-Cox transforms, date decomposition, and domain-specific aggregations. Feature selection prunes redundant or noisy inputs to reduce overfitting and improve speed via filter methods (correlation, mutual information, chi-square), wrapper methods (forward/backward selection, RFE), or embedded methods (L1 regularization, tree feature importance). Modern deep learning offloads much engineering to representation learning, but tabular problems still win or lose on features. Be careful about leakage: any transform that uses target statistics (target encoding, mean imputation) must be fit on training folds only.

**Key points:**
- Tabular ML lives and dies by features.
- Leakage is the silent killer; fit transforms on train only.
- Embeddings replace one-hot for high-cardinality categoricals.
- L1 and tree importance are practical embedded selectors.

---

### 7. Handling class imbalance

**Answer:** When one class dominates (e.g., fraud at 0.1%), naive models predict the majority and achieve high accuracy but useless recall. Remedies: resampling (oversample minority via SMOTE/ADASYN, undersample majority, or both), class weights in the loss (sklearn class_weight='balanced'), focal loss for hard-example focus, threshold tuning on the precision-recall curve instead of using 0.5, and choosing metrics that reflect the cost (PR-AUC, F1, recall@k, cost-sensitive metrics). Stratified splits keep ratios consistent. Beware: SMOTE in high dimensions creates unrealistic synthetic points; oversampling before CV leaks. For extreme imbalance, anomaly-detection framing or two-stage models (recall-heavy filter + precise classifier) often beat pure rebalancing.

**Key points:**
- Accuracy lies under imbalance; use PR-AUC, F1, recall@k.
- Class weights cheaper and safer than synthetic oversampling.
- Threshold tuning often the simplest big win.
- SMOTE inside CV folds, never before splitting.

---

### 8. Loss functions: when to use which

**Answer:** Regression: MSE (L2) penalizes outliers heavily, fast gradients near zero; MAE (L1) robust to outliers; Huber blends both. Binary classification: binary cross-entropy (log loss) for probability outputs, hinge loss for SVM-style max-margin. Multi-class: categorical cross-entropy with softmax. Ordinal regression: cumulative link or custom ordinal losses. Imbalanced: focal loss downweights easy examples. Ranking: pairwise (RankNet) or listwise (LambdaRank, ListNet). Embedding: contrastive, triplet, InfoNCE. Detection: combinations like focal + IoU/GIoU. Choice should match the output type and the cost structure of mistakes; never optimize MSE for classification or cross-entropy for regression. Calibration also depends on the loss—log loss naturally produces well-calibrated probabilities.

**Key points:**
- Match loss to output type and error cost.
- Cross-entropy calibrates probabilities; hinge doesn't.
- Huber/MAE for outlier-heavy regression.
- Focal loss for extreme class imbalance.

---

### 9. Classification metrics: precision, recall, F1, ROC-AUC, PR-AUC

**Answer:** Precision = TP/(TP+FP) (of predicted positives, how many right); recall = TP/(TP+FN) (of actual positives, how many caught). F1 is their harmonic mean, useful for balanced concern. ROC-AUC measures ranking quality across all thresholds via TPR vs FPR; insensitive to class balance but can be optimistic on heavily imbalanced data. PR-AUC plots precision vs recall and is more informative when positives are rare. Accuracy is misleading under imbalance. Pick metrics by cost: medical screening favors recall; spam filtering favors precision; ranking systems use AUC or NDCG. Always report multiple metrics and a confusion matrix, and tune the decision threshold to match operating constraints.

**Key points:**
- Precision and recall trade off via threshold.
- PR-AUC > ROC-AUC under heavy imbalance.
- Accuracy alone is rarely sufficient.
- Confusion matrix shows the actual error mix.

---

### 10. Probability calibration

**Answer:** A model is calibrated when predicted probability p means the event happens about p of the time. Tree ensembles, SVMs, and neural networks with cross-entropy can still be miscalibrated (often overconfident for deep nets, underconfident for boosted trees). Diagnose with reliability diagrams and Expected Calibration Error (ECE). Fix with Platt scaling (logistic regression on logits) for small data or two-class problems, or isotonic regression for flexible non-parametric calibration with enough data. Temperature scaling—dividing logits by a learned scalar T—is the standard fix for deep nets, preserves accuracy, and is dirt cheap. Always calibrate on a held-out set, not the training data, and re-calibrate when data distribution shifts.

**Key points:**
- ECE and reliability plots quantify miscalibration.
- Temperature scaling: one parameter, big win for nets.
- Isotonic flexible but needs more data than Platt.
- Calibrate after model selection, on a held-out set.

---

### 11. ROC vs PR curves: when to use which

**Answer:** ROC plots true positive rate vs false positive rate as threshold varies; AUC summarizes ranking quality and is invariant to class balance. PR plots precision vs recall and is sensitive to the positive class rate, making it more informative when positives are rare (fraud, disease, click prediction). Under heavy imbalance ROC-AUC can look great (say 0.95) while precision at useful recall is dismal; PR-AUC exposes that. Use ROC for balanced problems or when you need balance-invariant comparison across datasets, PR for imbalanced and information-retrieval-style problems. Both summarize across thresholds—still pick an operating threshold based on business cost.

**Key points:**
- ROC-AUC is balance-invariant; PR-AUC is not.
- Use PR-AUC when positives are scarce.
- Both summarize threshold choices; one still must be picked.
- Pair with confusion matrix at deployed threshold.

---

### 12. Generative vs discriminative models

**Answer:** Discriminative models learn P(y|x) directly: logistic regression, SVM, random forest, most neural networks. They focus capacity on the decision boundary, generally giving better classification accuracy with less data. Generative models learn P(x,y) or P(x|y) and use Bayes' rule for classification: naive Bayes, Gaussian mixture, HMM, VAE, diffusion. They can generate new samples, handle missing data, and detect anomalies (low P(x)). Discriminative is the default for classification when you only need labels; generative wins when you need data synthesis, semi-supervised learning, or principled uncertainty over inputs. Modern LLMs are technically generative (learn P(token | context)) but used for both generation and classification.

**Key points:**
- Discriminative: P(y|x), better classification accuracy.
- Generative: P(x,y), can sample and detect anomalies.
- LLMs are generative used discriminatively.
- Generative shines for semi-supervised and small-label regimes.

---

### 13. Parametric vs non-parametric models

**Answer:** Parametric models assume a fixed functional form with a fixed number of parameters (linear/logistic regression, naive Bayes, neural networks of fixed architecture). Training fits parameters; prediction is fast and memory-cheap. Non-parametric models grow capacity with data: KNN, decision trees, kernel SVMs, Gaussian processes. They make fewer assumptions and can fit arbitrary functions given enough data, at the cost of slower predictions and worse scaling. "Non-parametric" is a misnomer—they have parameters, just an unbounded number. Choose parametric when you have strong priors or need fast inference; non-parametric when relationships are unknown and you have moderate data. Tree ensembles dominate tabular ML by combining non-parametric flexibility with reasonable scaling.

**Key points:**
- Parametric = fixed capacity; non-parametric = grows with data.
- Trees and KNN are non-parametric workhorses.
- Non-parametric usually slower at inference.
- Tree ensembles often the tabular default.

---

### 14. The ML project lifecycle

**Answer:** Problem framing (what decision does the model improve, what's the metric, what's the baseline) → data collection and labeling → exploratory data analysis → feature engineering and splits → baseline model → iterative modeling with proper validation → error analysis → calibration and threshold tuning → offline evaluation on a held-out set → online A/B test against current production → monitoring (data drift, performance, fairness) → retraining cadence → eventual deprecation. Most failures are upstream: wrong problem, leaky data, mismatched offline/online metrics, no monitoring. Spend most time on data and evaluation, not on chasing a 0.5% AUC bump. The model is the cheap part.

**Key points:**
- Problem framing and metric design dominate outcomes.
- Online > offline; A/B test before trusting any model.
- Monitoring and retraining are part of the lifecycle.
- Data quality beats fancy algorithms.

---

### 15. Data leakage

**Answer:** Leakage occurs when information from outside the training set sneaks in, producing optimistic validation that collapses in production. Forms: target leakage (a feature is derived from or proxies the label, like "was_refunded" predicting "fraud"), train-test contamination (preprocessing on the full set before splitting), temporal leakage (using future info to predict the past), group leakage (same user in train and test), duplicate rows across splits. Symptoms: validation too good to be true, feature importance dominated by a single suspicious column. Prevention: split first, fit transforms on training folds only, validate by time when temporal, by group when grouped, and read top features critically. Suspect leakage whenever offline beats online by a wide margin.

**Key points:**
- Split first, transform later.
- Suspicious top features often = leakage.
- Time- and group-aware splits prevent silent leakage.
- Offline-to-online gap is the canonical symptom.

---

### 16. Logistic regression

**Answer:** Linear model passing w·x+b through a sigmoid (binary) or softmax (multi-class) to output probabilities, fit by maximizing log-likelihood (minimizing cross-entropy). Convex optimization gives a unique solution; coefficients have direct log-odds interpretation. Regularize with L1 (sparsity), L2 (shrinkage), or elastic net. Handles high-dimensional sparse features (text, ads) extremely well. Limitations: linear decision boundary in feature space (mitigated by interactions or kernels), assumes independent observations, sensitive to outliers and multicollinearity. Still a strong baseline and a workhorse in production for click prediction, credit scoring, and any setting where interpretability and calibrated probabilities matter more than raw accuracy.

**Key points:**
- Convex, calibrated, interpretable.
- Strong baseline for high-dim sparse problems.
- Add interactions or kernel to fight linearity limit.
- Regularize to handle collinearity and overfit.

---

### 17. Decision trees

**Answer:** Recursively partition feature space by greedy splits that maximize information gain (entropy reduction) or Gini impurity decrease for classification, variance reduction for regression. Handles mixed types, missing values, and non-linearities without scaling. Easy to interpret if shallow. Major weakness: high variance—small data changes can produce very different trees—and tendency to overfit. Control with max_depth, min_samples_leaf, ccp_alpha pruning. Trees rarely shine alone but are the building block for the most powerful tabular methods: random forests (bagging) and gradient-boosted trees (XGBoost/LightGBM/CatBoost). Greedy splitting can miss feature interactions; ensembling fixes this.

**Key points:**
- Greedy splits on impurity; no scaling required.
- High variance alone; ensemble for power.
- max_depth and min_samples_leaf control overfit.
- Foundation for RF and gradient boosting.

---

### 18. Random forests

**Answer:** Ensemble of decorrelated decision trees trained on bootstrap samples (bagging), with each split considering a random feature subset (typically sqrt(p) for classification, p/3 for regression). Predictions average (regression) or majority-vote (classification). Decorrelation via random features makes the ensemble's variance much lower than a single tree's. Robust to outliers, handles non-linear interactions, gives built-in feature importance and out-of-bag error estimates without a separate validation set. Tradeoffs: less interpretable than a single tree, slower than linear models, can underperform boosted trees on tabular benchmarks. Excellent default when you want a strong, low-maintenance tabular model with minimal tuning.

**Key points:**
- Bagging + random feature subsets = decorrelated trees.
- Out-of-bag samples give free validation estimate.
- Less tuning than boosting; often slightly weaker.
- Robust default for tabular problems.

---

### 19. Gradient boosting: XGBoost, LightGBM, CatBoost

**Answer:** Boosting fits trees sequentially, each correcting the previous ensemble's residuals via gradient descent on the loss function. XGBoost added second-order gradients, regularization, sparsity-aware splits, and parallelism; LightGBM uses histogram-based splits and leaf-wise growth for speed on large data; CatBoost handles categoricals natively via ordered target encoding to avoid leakage. They dominate tabular Kaggle competitions and production tabular ML. Key hyperparameters: number of trees (with early stopping on val), learning rate (smaller + more trees = better), max_depth or num_leaves, subsample/colsample, L1/L2 reg. Slower to train and less interpretable than RF, but typically the strongest tabular performer.

**Key points:**
- Sequential trees on residual gradients.
- LightGBM fastest; CatBoost best for categoricals.
- Tune trees + LR jointly with early stopping.
- Tabular ML's gold standard.

---

### 20. Support vector machines

**Answer:** Find the hyperplane that maximizes the margin between classes; only the support vectors (closest points) determine the boundary. Soft margin C parameter trades margin width vs misclassifications. Kernel trick (RBF, polynomial, linear) maps inputs to higher-dimensional spaces implicitly via the kernel function, enabling non-linear boundaries without explicit feature expansion. Effective in high dimensions and when features outnumber samples (text classification with TF-IDF). Limitations: O(n^2) to O(n^3) training scales poorly past ~100k samples, kernel choice is critical, outputs aren't probabilities by default (need Platt scaling), and tuning C and gamma matters. Largely supplanted by tree ensembles and neural nets but still strong on small high-dimensional datasets.

**Key points:**
- Margin maximization with support vectors.
- Kernel trick for non-linear boundaries.
- Doesn't scale past ~100k samples.
- Needs Platt scaling for probabilities.

---

### 21. K-nearest neighbors

**Answer:** Lazy learner: store all training data; at prediction time find the k closest training examples (by Euclidean, Manhattan, cosine, etc.) and majority-vote (classification) or average (regression). No training cost but slow O(n) inference unless indexed (KD-tree for low dim, ball tree, or ANN like HNSW/FAISS for high dim). Sensitive to feature scaling (always normalize), curse of dimensionality (distances become meaningless in high dim), and choice of k (small k = high variance, large k = high bias). Useful as a simple baseline, for recommender systems via embeddings + ANN search, and for anomaly detection. Largely replaced by learned models for direct classification but still essential in retrieval.

**Key points:**
- No training; slow inference without index.
- Must scale features; choose k by CV.
- Suffers in high dimensions.
- ANN libraries (FAISS, HNSW) make it scalable for retrieval.

---

### 22. Naive Bayes

**Answer:** Applies Bayes' theorem with the "naive" assumption that features are conditionally independent given the class. Variants: Gaussian (continuous features), multinomial (text token counts), Bernoulli (binary). Closed-form training (just count and normalize), extremely fast and memory-light, works surprisingly well for text classification (spam, sentiment) where the independence assumption is technically wrong but practically harmless. Calibration is poor (probabilities are overconfident due to the independence assumption being violated). Strong baseline for text and a great choice when you need a near-zero-cost model. Largely outperformed by logistic regression and transformer-based classifiers on substantial NLP tasks, but its simplicity keeps it relevant.

**Key points:**
- Assumes feature independence; rarely true but often works.
- Trains in one pass; extremely fast.
- Probabilities are not well calibrated.
- Best baseline for text and small-data classification.

---

### 23. K-means clustering

**Answer:** Partition n points into k clusters by minimizing within-cluster sum of squared distances. Lloyd's algorithm alternates: assign points to nearest centroid, recompute centroids. Initialize with k-means++ for better convergence. Requires k chosen a priori (use elbow method, silhouette score, or gap statistic). Assumes spherical clusters of similar size, sensitive to outliers and scaling. Mini-batch k-means scales to large data. Doesn't work well for non-convex or density-varying clusters—use DBSCAN, HDBSCAN, or spectral clustering instead. Practical for customer segmentation, vector quantization, anchor box selection, image compression. Always normalize features and try multiple seeds.

**Key points:**
- Assumes spherical equal-size clusters.
- k-means++ init avoids bad local minima.
- Pick k via elbow or silhouette.
- DBSCAN/HDBSCAN for arbitrary shapes.

---

### 24. PCA: principal component analysis

**Answer:** Linear dimensionality reduction that finds orthogonal directions (principal components) capturing maximum variance. Computed via SVD of the centered data matrix or eigendecomposition of the covariance matrix. Eigenvalues give variance explained per component. Use cases: visualization (project to 2-3 dims), denoising, decorrelation, feature compression before downstream models, speed-up of distance-based methods. Limitations: linear only (use kernel PCA or autoencoders for nonlinear), components are hard to interpret, sensitive to feature scaling (always standardize first), can hurt supervised performance if discarded components carry label info. For visualization of nonlinear structure, prefer t-SNE or UMAP; for compression with reconstruction, PCA is still the workhorse.

**Key points:**
- Maximizes variance along orthogonal axes.
- Standardize features first.
- Linear only; use kernel PCA or autoencoders for nonlinear.
- Pick components by cumulative variance explained.

---

### 25. t-SNE vs UMAP

**Answer:** Both are non-linear dimensionality reduction primarily for 2D/3D visualization of high-dimensional data (embeddings, single-cell genomics). t-SNE preserves local neighborhoods via probabilistic similarities, producing well-separated clusters but distorting global structure; slow O(n log n) with Barnes-Hut and unstable across runs (perplexity matters). UMAP uses fuzzy simplicial set theory, runs faster (linear-ish), preserves more global structure, and supports out-of-sample projection (you can fit then transform new points). UMAP is typically the default for new work. Both are visualization tools, not features for downstream models—distances in the projection are not meaningful and clusters can be artifacts.

**Key points:**
- Visualization only; don't use as ML features.
- UMAP faster and preserves global structure better.
- t-SNE perplexity, UMAP n_neighbors/min_dist are key knobs.
- Multiple runs and seeds for honest interpretation.

---

### 26. Backpropagation

**Answer:** Algorithm for efficiently computing gradients of a scalar loss with respect to all parameters by applying the chain rule in reverse topological order through a computation graph. Forward pass computes activations and the loss; backward pass propagates dL/d(output) backward, accumulating dL/dparam at each node. Cost is roughly twice the forward pass. Modern frameworks (PyTorch autograd, JAX, TensorFlow) build the graph dynamically or trace once and reuse. Key issues: numerical stability (use log-sum-exp), vanishing/exploding gradients in deep nets (mitigated by ReLU, batch/layer norm, residuals, careful init), and memory cost (mitigated by gradient checkpointing). Backprop is "just" the chain rule applied systematically, but it underpins all modern deep learning.

**Key points:**
- Reverse-mode autodiff via chain rule.
- Cost ~ 2x forward pass.
- Memory bottleneck handled by gradient checkpointing.
- Stable activations and normalization keep gradients flowing.

---

### 27. Gradient descent variants: SGD, momentum, Adam, AdamW

**Answer:** Vanilla SGD updates w := w - lr * grad; with mini-batches it adds noise that helps escape sharp minima. Momentum accumulates an EMA of past gradients (beta ~ 0.9), accelerating along consistent directions. Nesterov momentum looks ahead before computing the gradient. Adagrad scales each parameter's LR by inverse sqrt of accumulated squared gradients (good for sparse features but LR decays to zero). RMSProp uses an EMA instead. Adam = momentum + RMSProp with bias correction; very popular default. AdamW decouples weight decay from the adaptive update for better generalization, now the standard for transformers. SGD with momentum often generalizes best in vision; Adam/AdamW dominate language and large-scale training.

**Key points:**
- SGD+momentum: best generalization in many vision settings.
- Adam: fast convergence, good default.
- AdamW fixes weight-decay coupling in Adam.
- LR is the single most important hyperparameter.

---

### 28. Learning rate schedules

**Answer:** A constant LR is rarely optimal: too high diverges, too low crawls. Common schedules: step decay (drop by 10x every N epochs), exponential decay, cosine annealing (smoothly decreases to zero over training), cosine with warm restarts (SGDR), reduce-on-plateau (drop when validation stalls). For transformers, linear warmup over the first 1-10% of steps followed by cosine or linear decay to a fraction of peak is standard. Warmup avoids early instability when adaptive optimizers haven't built up variance estimates. One-cycle (Smith) ramps LR up then down within a single epoch and often trains faster. Use a learning-rate finder to pick peak LR. Schedule choice can swing final accuracy by several points.

**Key points:**
- Warmup + cosine is the transformer default.
- LR finder cheaply picks a good peak.
- Reduce-on-plateau is robust for unknown regimes.
- LR schedule choice often matters more than optimizer choice.

---

### 29. Batch normalization

**Answer:** Normalizes layer pre-activations across the batch dimension (subtract batch mean, divide by batch std), then applies learned scale and shift (gamma, beta). Stabilizes training, allows higher learning rates, acts as mild regularization, and accelerates convergence in CNNs. At inference, uses running averages of training-time statistics. Pitfalls: depends on batch size (poor for small batches or batch_size=1 fine-tuning), behaves differently in train vs eval mode (a common bug), doesn't play well with RNNs/transformers (use layer norm instead), and creates train-eval distribution mismatch. Replacements: layer norm (per-sample), group norm (groups of channels), instance norm (per-channel per-sample). BN remains the default in CNN backbones; transformers and RNNs use layer norm.

**Key points:**
- Normalizes across batch; learns gamma/beta.
- Bad for small batches; switch to GroupNorm/LayerNorm.
- Train/eval mode mismatch is a classic bug.
- CNNs use BN; transformers use LN.

---

### 30. Layer normalization

**Answer:** Normalizes across the feature dimension within a single sample, independent of batch size. Computed as (x - mean) / std with learned scale and shift, where mean and std are over the layer's features. Used in transformers and RNNs because it works for batch size 1, sequence-variable inputs, and online inference where running batch statistics aren't meaningful. Pre-norm (LayerNorm before the sub-layer) stabilizes transformer training over many layers, allowing scaling to hundreds of layers; post-norm (original transformer) often needs warmup tricks. RMSNorm drops the mean subtraction and bias, runs faster, and works as well in practice—used in LLaMA and many modern LLMs.

**Key points:**
- Per-sample normalization; batch-size independent.
- Pre-norm trains deeper, more stable.
- RMSNorm: simpler, faster, used in LLaMA/Mistral.
- Default for transformers and RNNs.

---

### 31. Dropout

**Answer:** During training, randomly zero each unit with probability p (typically 0.1-0.5), scaling surviving units by 1/(1-p). Acts as an ensemble over exponentially many sub-networks and a form of regularization that prevents co-adaptation. At inference, no dropout—full network with original weights. Most effective in fully-connected layers; less needed in convnets with BN, often unused in modern CNNs. In transformers, dropout is applied to attention probs, residuals, and FFN. Variants: DropConnect (drop weights, not activations), spatial dropout (drop entire feature maps in conv), DropPath/stochastic depth (drop whole residual branches). Modern large models often use small p (0-0.1) since data is abundant and overfitting less of a concern.

**Key points:**
- Stochastic ensemble for regularization.
- Off at inference; weights compensate via 1/(1-p) scaling.
- Less critical with BN and abundant data.
- DropPath/stochastic depth common in modern architectures.

---

### 32. Weight initialization

**Answer:** Bad init causes vanishing/exploding activations and dead neurons. Xavier/Glorot init scales weights by sqrt(2 / (fan_in + fan_out)) assuming linear/tanh; He init scales by sqrt(2 / fan_in) for ReLU. Bias usually initialized to 0; LSTM forget-gate bias often to 1 to start "remembering". For transformers, scaled init (Xavier with small constant) plus careful LayerNorm placement is standard. Orthogonal init useful for RNNs. Modern alternatives include LSUV (data-dependent rescaling) and Fixup/T-Fixup that remove the need for BN/LN. With proper init plus normalization, very deep networks train reliably; without either, anything beyond ~10 layers explodes or vanishes.

**Key points:**
- He init for ReLU; Xavier for tanh/linear.
- Bias to zero except LSTM forget gate.
- Init + normalization together enable deep training.
- Frameworks default to sensible inits; don't override blindly.

---

### 33. Vanishing and exploding gradients

**Answer:** In deep networks, gradients computed by chain-rule multiplication can shrink toward zero (saturating sigmoids/tanh, small weights) or blow up (large weights, recurrence). Vanishing prevents learning in early layers; exploding produces NaNs. Mitigations: ReLU and variants (no upper saturation), batch/layer normalization (keep activations well-scaled), residual connections (gradient highway), proper weight init (He/Xavier), gradient clipping (cap norm at 1.0 for RNNs/LLMs), LSTM/GRU gates (constant error carousel in cell state), and shorter effective depth via skip connections. Modern transformer training combines pre-norm, AdamW, warmup, and clipping. Catching exploding early is easy (loss NaN); vanishing is subtler—monitor per-layer gradient norms.

**Key points:**
- Symptoms: NaN loss, early-layer weights frozen.
- ReLU + norm + residuals + clipping = standard fix.
- LSTM gates designed specifically for vanishing.
- Monitor gradient norms per layer.

---

### 34. Residual connections (ResNets)

**Answer:** Add the input of a block to its output: y = F(x) + x. Lets gradients flow directly via the identity path, enabling training of networks hundreds or thousands of layers deep. The block learns the "residual" delta from identity rather than the full mapping, which is easier to optimize. Pre-activation variant (BN-ReLU-Conv inside the block) generalizes better. Residuals enable modern depth in ResNet (vision), Transformer (every sub-layer is residual), Diffusion U-Nets, etc. Without residuals, very deep nets degrade in training accuracy (not just test) because deeper hypothesis class is harder to optimize. One of the single most influential architectural innovations of the 2010s.

**Key points:**
- y = F(x) + x; gradient highway.
- Enables hundreds of layers without degradation.
- Pre-activation ResNet generalizes better.
- Used universally in modern deep architectures.

---

### 35. Attention mechanism

**Answer:** Computes a weighted combination of values where weights come from a learned similarity between queries and keys. Scaled dot-product attention: softmax(QK^T / sqrt(d_k)) V. Lets each position aggregate information from any other position based on content, replacing fixed receptive fields. Self-attention has Q, K, V all derived from the same input. Multi-head attention runs h parallel heads with different projections, concatenating results—captures diverse relations. Original use was for encoder-decoder alignment in NMT; the transformer replaced recurrence entirely with self-attention. Cost is O(n^2 * d) in sequence length, motivating sparse/linear approximations for long contexts. Attention is the foundation of modern NLP and increasingly vision.

**Key points:**
- Softmax(QK^T / sqrt(d_k)) V.
- Multi-head captures multiple relation types.
- O(n^2) cost drives long-context research.
- Self-attention replaced recurrence in transformers.

---

### 36. Activation functions

**Answer:** Non-linearities that let networks model non-linear functions. Sigmoid and tanh saturate, causing vanishing gradients—rarely used in hidden layers anymore. ReLU max(0, x) is fast, non-saturating in positives, and dominates CNNs; suffers from "dying ReLU" (units stuck at 0). Leaky ReLU/PReLU/ELU/SELU patch this with a small negative slope. GELU x*Phi(x) is smoother and standard in transformers (BERT, GPT). Swish/SiLU x*sigmoid(x) similar to GELU, used in EfficientNet, LLaMA. Softmax for output probabilities (sums to 1); sigmoid for binary outputs. Modern LLMs prefer GeGLU/SwiGLU gated variants in FFN. Pick based on architecture norm and empirical evidence; rarely a top-3 hyperparameter.

**Key points:**
- ReLU default; GELU/SwiGLU for transformers.
- Dying ReLU mitigated by Leaky/PReLU.
- Softmax for multi-class outputs.
- Gated activations (SwiGLU) common in modern LLMs.

---

### 37. CNNs: convolution and pooling

**Answer:** Convolution slides a small learned filter across the input, computing dot products to produce feature maps. Properties: weight sharing (same filter at every spatial location, drastically fewer params than fully-connected), translation equivariance (object detected anywhere), local receptive field that grows with depth. Stride, padding, and dilation control output size and receptive-field growth. Pooling (max, average) downsamples spatially, providing translation invariance and reducing compute. Modern architectures often replace pooling with strided convolution. 1x1 convs change channels without spatial change—useful as bottlenecks. Foundation of image, audio, and increasingly time-series models. ViT challenged the necessity of convolutions but hybrid models often still win on efficiency.

**Key points:**
- Weight sharing + locality = parameter efficiency.
- Pooling provides translation invariance.
- 1x1 conv for channel mixing/bottlenecks.
- ViT competes but convs still strong on small data.

---

### 38. ResNet, EfficientNet, ViT

**Answer:** ResNet introduced residual connections, enabling 50/101/152-layer image classifiers that became the de facto CNN backbone. EfficientNet uses neural architecture search (NAS) plus compound scaling that jointly increases depth, width, and resolution, achieving better accuracy/FLOPs tradeoffs than uniformly scaling one axis; uses inverted residuals (MBConv) and SE blocks. ViT (Vision Transformer) splits images into patches, treats them as a token sequence, and applies a standard transformer—requires large pretraining (JFT-300M) to beat CNNs but scales beautifully. Hybrids like ConvNeXt apply transformer-era tricks back to CNNs. ResNet remains a strong default for smaller data; ViT and successors (Swin, DINOv2) lead at scale.

**Key points:**
- ResNet: residuals enable deep nets.
- EfficientNet: NAS + compound scaling.
- ViT: patches + transformer; needs scale.
- ConvNeXt: modernized CNN competitive with ViT.

---

### 39. RNNs, LSTMs, GRUs

**Answer:** RNNs process sequences with a hidden state updated at each step. Vanilla RNNs suffer vanishing gradients—can't learn long dependencies. LSTM adds input/forget/output gates and a cell state that flows through time with minimal transformation (constant error carousel), enabling long-range learning. GRU merges forget and input into an update gate and ties cell+hidden; fewer parameters, often comparable performance to LSTM. Bidirectional variants run forward and backward, concatenating states (only for non-streaming tasks). Heavy in NLP/speech until 2017–2018; largely superseded by transformers for most tasks because of sequential bottleneck and limited long-range modeling. Still used in streaming/low-latency contexts and on-device.

**Key points:**
- LSTM gates fix vanishing in vanilla RNN.
- GRU simpler than LSTM, similar performance.
- Sequential = hard to parallelize on GPU.
- Mostly replaced by transformers since 2018.

---

### 40. Why transformers replaced RNNs

**Answer:** RNNs process tokens sequentially, preventing GPU parallelism and creating long-range gradient issues despite LSTM mitigation. Transformers replace recurrence with self-attention plus positional encoding: every position attends to every other in one matmul, fully parallelizable across the sequence, with constant path length between any two tokens (much better gradient flow). Scaling laws are smoother and more predictable. Costs: O(n^2) attention complexity in sequence length and quadratic memory motivate long-context research (FlashAttention, sparse, linear attention, SSMs). Transformers also benefited from a happy convergence with hardware (matmul-heavy) and large pretraining datasets. The result: dominant in NLP since 2018 (BERT/GPT) and rapidly spreading to vision (ViT), speech, and biology.

**Key points:**
- Parallelism across sequence is the killer feature.
- Constant path length improves gradient flow.
- O(n^2) cost drove long-context innovations.
- Pretraining + scaling laws made transformers unstoppable.

---

### 41. The Transformer architecture

**Answer:** Encoder-decoder model from "Attention Is All You Need" (2017). Encoder: stack of identical blocks, each with multi-head self-attention + position-wise FFN, both wrapped in residual + LayerNorm. Decoder: same plus masked self-attention (prevents peeking ahead) and encoder-decoder cross-attention. Positional encoding (sinusoidal or learned) injects order. Modern variants: encoder-only (BERT) for understanding, decoder-only (GPT) for generation, encoder-decoder (T5, BART) for seq2seq. Innovations since: pre-norm, RMSNorm, rotary positional embeddings (RoPE), grouped-query attention (GQA/MQA), SwiGLU FFN, FlashAttention. The basic block has remained remarkably stable since 2017; most progress has been scale + data + small architectural tweaks.

**Key points:**
- Attention + FFN + residual + LayerNorm = a block.
- Encoder, decoder, or both depending on task.
- RoPE, GQA, SwiGLU are modern standard upgrades.
- Architecture stable since 2017; scale did the heavy lifting.

---

### 42. Self-attention vs cross-attention

**Answer:** Self-attention: Q, K, V all come from the same sequence; lets each token attend to others in the same context. Used in encoders (bidirectional, no mask) and decoders (causal mask hides future tokens). Cross-attention: Q from one sequence (e.g., decoder), K and V from another (e.g., encoder output). Used in encoder-decoder transformers (T5, BART, original Transformer) and in conditioning (e.g., text→image diffusion: U-Net attends to text embeddings). Modern decoder-only LLMs use only self-attention with causal masking; encoder-decoder is making a comeback for some specialized tasks (translation, code edit). Cross-attention is the canonical way to inject external context (RAG/tools may use it implicitly via concatenation).

**Key points:**
- Self: Q,K,V from same source.
- Cross: Q from one, K/V from another.
- Causal mask = decoder; no mask = encoder.
- Cross-attention is the standard conditioning mechanism.

---

### 43. Multi-head attention

**Answer:** Project Q, K, V into h subspaces (heads), run scaled dot-product attention in parallel per head, concatenate, then project back. Lets the model attend to information from different representation subspaces and positions simultaneously—heads can specialize in syntax, coreference, position, semantics. Total parameters comparable to single-head with equivalent d_model, but expressivity is higher. Modern efficiency tricks: Multi-Query Attention (MQA, all heads share one K/V) cuts KV cache memory at small quality cost; Grouped-Query Attention (GQA) groups heads to share K/V—a sweet spot used in LLaMA-2/3, Mistral. Heads can be pruned post-training; many are redundant. Number of heads is typically d_model / 64.

**Key points:**
- Parallel heads over different subspaces.
- Heads often specialize interpretably.
- MQA/GQA reduce KV cache for long-context inference.
- Pruning shows many heads are redundant.

---

### 44. Positional encoding: sinusoidal, learned, RoPE, ALiBi

**Answer:** Attention is permutation-invariant—it needs position info. Original transformer added sinusoidal vectors of varying frequencies; learned embeddings (BERT/GPT-2) work as well but don't generalize beyond train length. Rotary Position Embedding (RoPE) rotates Q and K by position-dependent angles, encoding relative position multiplicatively; generalizes better and is standard in LLaMA, Mistral, Qwen. ALiBi adds a position-dependent linear bias to attention scores, no embedding needed, extrapolates well. NoPE drops positional encoding entirely in some decoder-only setups (causal mask provides ordering). For long-context extension, RoPE with scaling/interpolation (NTK-aware, YaRN) lets pretrained models work at longer lengths than seen during training.

**Key points:**
- Attention needs explicit position signal.
- RoPE dominates modern LLMs.
- ALiBi extrapolates well to longer sequences.
- YaRN/NTK scaling stretch RoPE for long context.

---

### 45. BERT vs GPT vs T5

**Answer:** BERT (encoder-only): masked language modeling + next-sentence pretraining, bidirectional context; fine-tune for classification, NER, QA span extraction; not designed for generation. GPT (decoder-only): autoregressive next-token prediction with causal mask; generation native; scales to general-purpose assistants. T5 (encoder-decoder): everything is text-to-text; mask spans pretraining; flexible for translation, summarization, classification cast as generation. Today most foundation models are decoder-only (GPT-4, Claude, Llama, Mistral) because of scaling efficiency and the success of in-context learning. Encoder-only (BERT family) still dominates embedding/classification at lower cost. Encoder-decoder (T5, BART, FLAN-T5) keeps niches like translation and instruction-following at small scale.

**Key points:**
- BERT = understand; GPT = generate; T5 = both.
- Decoder-only won the scaling race.
- BERT-family still rules cheap classification/embeddings.
- T5 popular for fine-tuning text-to-text tasks.

---

### 46. Vision Transformer (ViT)

**Answer:** Split image into fixed-size patches (e.g., 16x16), linearly embed each patch + add positional embedding + prepend a [CLS] token, then run a standard transformer encoder. The [CLS] embedding (or pooled patch embeddings) drives classification. With sufficient pretraining (300M+ images like JFT) ViT beats CNNs; on small data alone it underperforms because it lacks CNN inductive biases (locality, translation equivariance). Variants: Swin uses shifted windows for hierarchical features and linear-ish scaling; DeiT trains data-efficiently with distillation; DINOv2 self-supervised at scale. ViT and successors now dominate vision benchmarks and underpin multimodal models (CLIP, GPT-4V, Gemini).

**Key points:**
- Patches as tokens + standard transformer.
- Needs scale to beat CNNs; weak on small data alone.
- Swin/Hierarchical variants improve efficiency.
- Foundation of modern multimodal vision encoders.

---

### 47. GANs

**Answer:** Generator G maps noise z to data; Discriminator D classifies real vs generated. Trained adversarially: D maximizes correctly distinguishing, G minimizes D's accuracy via gradients through D. Theoretical equilibrium is data distribution. In practice: mode collapse (G ignores parts of distribution), training instability, no principled likelihood, fragile to hyperparameters. Major variants: DCGAN (CNN backbone), WGAN/WGAN-GP (Earth-Mover distance, more stable), StyleGAN (state-of-the-art face synthesis with style-based generator), conditional GANs (class or text guidance), CycleGAN (unpaired domain translation). Largely supplanted by diffusion for image synthesis since 2022 because of stability and better coverage, though GANs remain faster at inference (single forward pass).

**Key points:**
- Adversarial min-max game.
- Mode collapse and instability are classic failures.
- StyleGAN family long held SOTA for faces.
- Diffusion mostly replaced GANs since 2022.

---

### 48. VAEs

**Answer:** Variational Autoencoders: encoder produces parameters of a posterior q(z|x) (typically Gaussian), decoder reconstructs x from latent z sampled via reparameterization trick (z = mu + sigma * epsilon). Trained to maximize ELBO = reconstruction term + KL divergence between q(z|x) and prior p(z) (usually unit Gaussian). KL pushes latents toward the prior, giving structured generative latent space; reconstruction keeps fidelity. Produces blurrier samples than GANs but is stable and gives principled latents. Variants: beta-VAE for disentanglement, VQ-VAE with discrete latents (used in DALL-E 1 and as the autoencoder in latent diffusion models like Stable Diffusion). The VAE encoder in Stable Diffusion is a major reason it scales—diffusion happens in latent space, not pixel space.

**Key points:**
- ELBO = reconstruction + KL.
- Reparameterization makes sampling differentiable.
- Blurrier than GANs but more stable.
- VQ-VAE underpins latent diffusion.

---

### 49. Diffusion models

**Answer:** Forward process: gradually add Gaussian noise to data over T steps until pure noise. Reverse process: train a neural network (typically U-Net or DiT) to predict the noise at each step, then iteratively denoise. Trained with a simple noise-prediction MSE loss (Ho et al., DDPM). Sampling: start from noise, run reverse process for T steps (or fewer via DDIM, DPM-Solver, etc.). Latent Diffusion (Stable Diffusion) runs diffusion in a VAE's latent space for ~10x speedup. Conditional generation via classifier-free guidance: jointly train conditional and unconditional, combine at sampling time scaled by guidance weight w. Now the dominant paradigm for image/video/audio synthesis (DALL-E 3, SD3, Midjourney, Sora-style video models).

**Key points:**
- Learn to denoise; iterative reverse process.
- Latent diffusion makes high-res practical.
- Classifier-free guidance for conditioning.
- Replaced GANs as the SOTA generative paradigm.

---

### 50. Diffusion vs GANs vs autoregressive image models

**Answer:** GANs: single forward pass, fast inference, sharp images, but mode collapse and unstable training. Diffusion: iterative denoising (many forward passes), slow inference but easy training, broad mode coverage, controllable via guidance—current SOTA for fidelity and diversity. Autoregressive image models (DALL-E 1, Parti, MAR): predict tokens sequentially like a language model on a VQ-VAE codebook; flexible and easy to scale via transformers but quadratic cost and unidirectional. Consistency models, flow matching, and rectified flow aim to combine diffusion's quality with GAN-like one-step generation. In production: SD/SDXL/SD3 for cheap open-weight images, DALL-E 3/Midjourney for closed-source quality, autoregressive for unified multimodal foundation models.

**Key points:**
- GAN: fast, unstable.
- Diffusion: slow, stable, current SOTA.
- AR: scales like LLMs, easy multimodal unification.
- One-step diffusion (consistency/rectified flow) closes the inference gap.

---

### 51. Self-supervised learning

**Answer:** Train representations from unlabeled data using pretext tasks where the supervision signal comes from the data itself. Examples: masked language modeling (BERT predicts hidden tokens), next-token prediction (GPT), masked image modeling (MAE reconstructs masked patches), contrastive learning (SimCLR/CLIP pull augmentations together, push others apart), bootstrap methods (BYOL/DINO use a target network without negatives). SSL unlocked modern foundation models by leveraging vast unlabeled corpora. The resulting representations transfer to downstream tasks via fine-tuning or linear probing, often with little labeled data. Self-supervised pretraining + supervised fine-tuning is the dominant paradigm in NLP and vision. Quality of pretext task matters more than model size at small scale.

**Key points:**
- Supervision invented from data itself.
- Powers BERT, GPT, CLIP, DINO, MAE.
- Pretraining + fine-tuning is the modern workflow.
- Pretext task design matters.

---

### 52. Transfer learning and fine-tuning

**Answer:** Reuse a model pretrained on a large general dataset for a smaller related task. Strategies: feature extraction (freeze backbone, train new head), full fine-tuning (update all params with low LR), layer-wise fine-tuning (unfreeze top-down). In NLP, fine-tune BERT/GPT on classification, NER, QA. In vision, fine-tune ImageNet/JFT/CLIP backbones. Key tricks: lower LR for pretrained layers (10x-100x smaller), warmup, discriminative LRs per layer, frozen early layers for small data, regularization (dropout, weight decay) to avoid catastrophic forgetting. For LLMs, parameter-efficient methods (LoRA, adapters) replace full fine-tuning at near-equal quality with tiny memory. Transfer learning is the default for almost every modern ML application.

**Key points:**
- Pretrained backbone + task head = standard recipe.
- Lower LR on pretrained weights.
- LoRA/PEFT replace full fine-tuning for LLMs.
- Catastrophic forgetting mitigated by careful LR/freezing.

---

### 53. LoRA and parameter-efficient fine-tuning (PEFT)

**Answer:** Full fine-tuning of large models is memory-prohibitive. LoRA (Low-Rank Adaptation) freezes pretrained weights and injects trainable low-rank matrices A (d x r) and B (r x d) such that the effective update is W + BA, where r << d (e.g., r=8-64). Only ~0.1-1% of params trained, with quality near full fine-tuning for many tasks. QLoRA quantizes the base model to 4-bit while training full-precision LoRA adapters—fine-tune 70B models on a single 48GB GPU. Other PEFT: adapters (small bottleneck modules in each layer), prefix tuning (learnable prefix tokens), prompt tuning (learnable soft prompts). LoRA is the dominant PEFT method for LLMs because of its simplicity, mergeable adapters, and ecosystem support.

**Key points:**
- Trains a low-rank delta instead of full weights.
- QLoRA: 4-bit base + LoRA = consumer-GPU fine-tuning.
- Adapters mergeable into base for zero-cost inference.
- Default for LLM customization since 2023.

---

### 54. Knowledge distillation

**Answer:** Train a small "student" model to match a larger "teacher" model's behavior. Loss combines hard-label cross-entropy with soft-label KL divergence on teacher's output distribution (often with a temperature T applied to softmax to soften probabilities and reveal dark knowledge). Variants: hidden-state matching, attention matching, sequence-level distillation for generation. Used to compress BERT (DistilBERT, TinyBERT, MiniLM), make production LLMs from frontier models (Alpaca, Vicuna distilled GPT-4 outputs), and create on-device models. Pairs well with quantization and pruning. The student often beats training from scratch on the same data because of the teacher's smoother label distribution. Critical: data diversity matters more than quantity for distillation quality.

**Key points:**
- Match teacher's soft outputs, not just hard labels.
- Temperature softens probabilities for richer supervision.
- DistilBERT, Vicuna are canonical examples.
- Stack with quantization for max compression.

---

### 55. Quantization: INT8, INT4, GPTQ, AWQ

**Answer:** Represent weights/activations in fewer bits to cut memory and speed up inference. INT8 post-training quantization is near-lossless for most models with calibration; INT4 needs more care. Methods: GPTQ (per-layer second-order optimization to minimize reconstruction error), AWQ (activation-aware—protects salient weight channels), bitsandbytes NF4 (used in QLoRA, optimal for normal distributions), GGUF/llama.cpp formats for CPU/GPU inference. Quantization-aware training (QAT) integrates quantization into training for best quality but is expensive. Tradeoffs: smaller/faster but some accuracy loss, especially at INT4 for small models. Modern open-weight LLMs are routinely served at INT4-8; for cutting-edge tasks (reasoning, code) keep higher precision. Combine with KV-cache quantization for long-context savings.

**Key points:**
- INT8 nearly free; INT4 needs care.
- GPTQ and AWQ are top post-training methods.
- QLoRA uses NF4 base + FP16 LoRA.
- Quantize KV cache too for long contexts.

---

### 56. Tokenization: BPE, WordPiece, SentencePiece

**Answer:** Splits text into model-input units. Byte Pair Encoding (BPE) starts with characters, iteratively merges the most frequent adjacent pair; used by GPT family, RoBERTa. WordPiece (BERT) is similar but merges to maximize training-corpus likelihood. SentencePiece (T5, LLaMA, Mistral) operates directly on raw text (whitespace included), handles any language without pre-tokenization, supports BPE or unigram LM. Byte-level BPE (GPT-2 onward) handles arbitrary bytes including emoji and non-Latin scripts robustly. Tradeoffs: vocab size (32k-256k typical) affects sequence length and embedding table size. Tokenization edge cases (numbers, code, non-English) drive many LLM bugs; modern models add digit-by-digit splitting or larger multilingual vocabs.

**Key points:**
- BPE: greedy frequency-based merges.
- SentencePiece: language-agnostic, raw text.
- Byte-level BPE handles any input.
- Vocab size trades sequence length vs embedding size.

---

### 57. Word embeddings: word2vec, GloVe, fastText

**Answer:** Map words to dense vectors capturing semantic similarity. word2vec (Mikolov) trains via skip-gram (predict context from word) or CBOW (predict word from context) with negative sampling—efficient and produces vectors where analogies (king - man + woman ≈ queen) work. GloVe factorizes a word co-occurrence matrix to capture global statistics. fastText extends word2vec with subword (character n-gram) embeddings, handling OOV and morphologically rich languages. Static embeddings (one vector per word regardless of context) were SOTA until 2018, when contextual embeddings (ELMo, BERT) replaced them. Still useful as cheap features and for initializing downstream models; cosine similarity gives intuitive semantic relatedness.

**Key points:**
- One vector per word, context-free.
- word2vec analogies showed vector arithmetic semantics.
- fastText handles subwords and OOV.
- Replaced by contextual embeddings post-2018.

---

### 58. Contextual embeddings and sentence embeddings

**Answer:** Contextual embeddings (ELMo, BERT, GPT) produce different vectors for a word depending on its sentence context, capturing polysemy ("bank" in finance vs river). Extracted from a pretrained transformer's hidden states. For sentence-level tasks: pool token embeddings (mean, CLS, max), or use models tuned for sentence similarity. Sentence-BERT (SBERT) fine-tunes BERT with siamese/triplet loss to produce sentence vectors where cosine similarity matches semantic similarity—much better than raw BERT CLS. Modern embedding models (OpenAI ada/text-embedding-3, BGE, E5, Nomic, Cohere) use contrastive fine-tuning on large web pairs to produce high-quality multilingual embeddings. Foundation of semantic search, RAG, clustering, dedup, recommendation.

**Key points:**
- Context-dependent vectors per token.
- SBERT-style models for sentence similarity.
- Modern embedding models trained contrastively on web pairs.
- Backbone of RAG and semantic search.

---

### 59. Pretraining objectives for LLMs

**Answer:** Causal language modeling (CLM, next-token prediction): standard for GPT-style decoders; simple, scales beautifully, native for generation. Masked language modeling (MLM): predict masked tokens from bidirectional context; used by BERT-family, good for understanding/classification. Span corruption (T5): mask consecutive spans, predict them as a target sequence; combines bidirectional encoding with generation. Prefix LM: bidirectional on a prefix, causal afterward (UL2, GLM). Mix-of-objectives (UL2's MoD) trains on multiple objectives. Empirically, CLM scales best for general-purpose LLMs; MLM excels at fixed-vocab understanding tasks at smaller scale. Beyond pretraining, models are post-trained with instruction tuning and RLHF/DPO.

**Key points:**
- CLM: scales for general LLMs.
- MLM: best for understanding/classification.
- Span corruption: T5's middle ground.
- Mix-of-objectives improves few-shot transfer.

---

### 60. Instruction tuning

**Answer:** Fine-tune a pretrained LLM on (instruction, response) pairs across many tasks (FLAN, T0, Alpaca, ShareGPT, Open-Orca data). Teaches the model to follow user-style natural-language instructions in zero/few-shot rather than relying solely on prompt patterns from raw pretraining. Doesn't fundamentally add knowledge; reshapes interaction style and unlocks capabilities latent in the base model. Often the first step in post-training before RLHF/DPO. Quality of data matters more than quantity—LIMA showed 1000 carefully curated examples suffice for strong assistants. Pitfalls: overfit to instruction format, lose diversity, regress on benchmarks the base model handled. Pair with safety tuning to suppress unwanted behaviors.

**Key points:**
- Teaches format, not new facts.
- Data quality > quantity (LIMA).
- Step 1 of post-training pipeline.
- Watch for capability regressions.

---

### 61. RLHF: reinforcement learning from human feedback

**Answer:** Three-stage post-training pipeline. Stage 1 (SFT): instruction-tune on curated demonstrations. Stage 2 (reward model): humans rank multiple responses to a prompt; train a model to predict preferred outputs (typically Bradley-Terry log-likelihood). Stage 3 (PPO): fine-tune the LLM with reinforcement learning, maximizing reward-model score with a KL penalty to the SFT model to prevent reward hacking and distribution collapse. Used to align GPT-3.5/4, Claude, Gemini. Strengths: handles subjective qualities (helpfulness, harmlessness, style) that are hard to specify with examples. Weaknesses: complex pipeline, reward hacking, mode collapse, sycophancy. DPO and successors aim to simplify by removing the explicit RL step.

**Key points:**
- SFT → reward model → PPO.
- KL penalty controls distribution drift.
- Aligns subjective qualities beyond demonstrations.
- Complex; DPO is the modern simpler alternative.

---

### 62. DPO and preference optimization variants

**Answer:** Direct Preference Optimization (DPO) reformulates RLHF as a classification problem: given preference pairs (chosen, rejected), directly optimize the LLM to assign higher likelihood to chosen vs rejected, with an implicit KL penalty to the reference model. No reward model, no PPO, no rollouts—just gradient descent on a closed-form loss. Trains much faster, simpler, more stable, and often matches PPO quality. Variants: IPO fixes DPO's preference overfitting, KTO uses unpaired binary feedback, ORPO combines SFT+preference in one step, SimPO removes the reference model. The 2024-2025 industry trend is DPO-family for most post-training, with PPO reserved for online or process-supervision settings. Easy enough to run on consumer hardware with LoRA.

**Key points:**
- Closed-form preference loss; no RL.
- Faster, simpler, comparable to PPO.
- IPO/KTO/ORPO/SimPO are practical improvements.
- Now dominant for open-source LLM alignment.

---

### 63. In-context learning and few-shot prompting

**Answer:** LLMs can perform new tasks at inference by being shown a few input-output examples in the prompt (few-shot) or just a description (zero-shot)—no gradient updates. Capability emerges from large-scale pretraining and improves with model size and example quality/diversity. Order, format, and label distribution of examples matter (recency bias, majority-label bias). Underlying mechanism is debated but partly involves "induction heads" that copy patterns across the context. ICL is essentially free at inference time but consumes context tokens and is less reliable than fine-tuning for high-stakes tasks. Strong baseline before considering RAG or fine-tuning; foundation of prompt engineering.

**Key points:**
- No parameter updates—just examples in prompt.
- Sensitive to example order, format, label balance.
- Cheap to try; less reliable than fine-tuning.
- Often a strong baseline.

---

### 64. Prompt engineering techniques

**Answer:** Structure inputs to elicit better LLM outputs. Core techniques: clear role/task statement, explicit format/structure (JSON schema, XML tags), few-shot examples, decomposition (break complex into steps), self-consistency (sample multiple, vote), retrieval grounding (RAG), tool use, structured output (function calling, JSON mode). Patterns: chain-of-thought ("think step by step"), tree-of-thought, ReAct (reasoning + acting), program-aided LM (use code execution). Anti-patterns: vague instructions, conflicting examples, leading questions. Modern LLMs are robust enough that prompt fragility has decreased, but for high-stakes apps a systematic prompt template, eval suite, and version control matter as much as model choice. Treat prompts as code.

**Key points:**
- Be explicit about role, format, constraints.
- CoT, self-consistency, ReAct are go-to patterns.
- Few-shot examples shape format and behavior.
- Prompts deserve version control and eval suites.

---

### 65. Chain-of-thought (CoT) reasoning

**Answer:** Prompt LLMs to generate intermediate reasoning steps before the final answer, e.g., appending "Let's think step by step." Originally a few-shot prompt trick (Wei et al., 2022); now baked into modern models via training. Improves performance on math, logic, multi-step reasoning, especially in larger models—emergent at scale. Self-consistency: sample multiple CoT paths and majority-vote the final answer—often a large boost. Tree-of-Thought generalizes to search over reasoning branches. Long-CoT / "reasoning models" (OpenAI o1/o3, DeepSeek-R1, Claude with thinking) train models to produce long chains of thought via RL on verifiable rewards, dramatically improving math/code/STEM at the cost of latency and tokens. The 2024-2026 shift toward "thinking" models made CoT a first-class capability.

**Key points:**
- Intermediate steps improve reasoning.
- Self-consistency = sample many, vote.
- Reasoning models (o1, R1) trained for long CoT.
- Costs latency and tokens; not always worth it for simple tasks.

---

### 66. Context window and KV cache

**Answer:** Context window is the max sequence length a transformer can attend over—2k for GPT-2 era, now 200k-2M for frontier models (Claude, Gemini). During generation, the KV cache stores previously computed Key and Value tensors so each new token only attends over cached K/V instead of recomputing—turns O(n^2) per token into O(n). KV cache grows linearly with context length and dominates memory at long contexts (e.g., LLaMA-70B at 32k ≈ tens of GB). Optimizations: GQA/MQA reduce KV heads, paged attention (vLLM) manages KV like virtual memory, quantized KV cache (INT8/FP8), prompt caching (reuse cache across calls with shared prefix), sliding window attention discards old KV. Long-context inference economics is dominated by KV cache management.

**Key points:**
- KV cache makes generation O(n), not O(n^2) per token.
- Memory dominated by KV at long contexts.
- GQA, paged attention, quantization reduce KV cost.
- Prompt caching reuses prefix KV across requests.

---

### 67. Attention scaling: FlashAttention, sparse, linear

**Answer:** Vanilla attention is O(n^2) in compute and memory due to the n x n attention matrix. FlashAttention (Dao et al.) reorganizes computation to avoid materializing the full matrix using tiling + recomputation, gaining 2-4x speedup and major memory savings—now standard in PyTorch/CUDA kernels. Sparse attention (BigBird, Longformer) restricts attention to local windows + global tokens, achieving sub-quadratic complexity at the cost of expressivity. Linear attention (Performer, Linformer) approximates softmax with kernels for O(n) cost; quality often lags. State-Space Models (Mamba, Mamba-2) replace attention entirely with selective SSMs, achieving linear-time training and competitive quality on language. Hybrid attention+SSM (Jamba, Zamba) blends both. The field is actively shifting toward sub-quadratic alternatives for very long contexts.

**Key points:**
- FlashAttention: same math, IO-aware, 2-4x faster.
- Sparse/linear attention reduce complexity but lose quality.
- Mamba/SSMs are emerging linear alternatives.
- Hybrid architectures are practical compromises.

---

### 68. Mixture of Experts (MoE)

**Answer:** Replace each FFN with N expert FFNs and a router that picks top-k (typically k=1 or 2) experts per token. Total parameters scale to hundreds of billions while compute per token only uses k/N of them—e.g., Mixtral 8x7B has ~47B params but uses ~13B per token. Training requires load-balancing loss to prevent router collapse (all tokens go to one expert) and routing tricks (expert capacity, switch transformers). Benefits: better quality per FLOP, easier to scale parameters than dense. Drawbacks: more memory (all experts loaded), harder to serve efficiently, more complex training. Used in Mixtral, DeepSeek-V3 (256 experts), GPT-4 (rumored), Grok-1, DBRX. The frontier of efficient scaling.

**Key points:**
- Sparse activation: huge params, modest compute.
- Top-k routing per token.
- Load balancing prevents collapse.
- Modern frontier: DeepSeek-V3, Mixtral, GPT-4-class.

---

### 69. MQA and GQA: efficient KV

**Answer:** Standard multi-head attention has h Q heads, h K heads, h V heads. Multi-Query Attention (MQA, Shazeer 2019) shares one K and one V across all heads—cuts KV cache and memory bandwidth by ~h-fold with small quality cost. Grouped-Query Attention (GQA) is the middle ground: h Q heads, g K/V heads (g = h / group_size). LLaMA-2/3 use g=8 with 32 or 64 Q heads, getting most of MQA's speedup with almost no quality loss. Critical for long-context inference where KV cache dominates memory. Now standard in essentially every modern open LLM. Conversion from full MHA to GQA can be done post-hoc with light fine-tuning.

**Key points:**
- MQA: single K/V shared; cuts cache ~h-fold.
- GQA: groups K/V heads; sweet spot.
- Standard in LLaMA-2/3, Mistral, modern LLMs.
- Critical for long-context inference economics.

---

### 70. Long-context techniques

**Answer:** Pretraining at long sequence is expensive due to O(n^2) attention. Extension strategies: position interpolation (linearly scale RoPE positions), NTK-aware scaling (frequency-domain interpolation), YaRN (better NTK with attention temperature) extend a model trained at 4k/8k to 32k-128k with brief fine-tuning. Sliding window attention (Mistral) keeps recent K/V plus attention sinks (StreamingLLM keeps initial tokens that act as bias). For inference, prompt caching reuses prefix KV across requests; chunked prefill batches long-prompt processing. Architectural alternatives: SSMs (Mamba), hybrid models (Jamba), retrieval to keep needed context shorter. Despite headline context lengths of 1M+ tokens, effective context (where the model actually uses distant info) is often much shorter—the "lost in the middle" problem.

**Key points:**
- RoPE scaling (YaRN/NTK) extends pretrained models.
- Sliding window + attention sinks for streaming.
- "Lost in the middle" is a real quality cliff.
- RAG often beats stuffing everything into context.

---

### 71. Hallucination in LLMs

**Answer:** LLMs sometimes produce confident, fluent text that is factually wrong or invented (citations, statistics, code). Causes: pretraining data errors, autoregressive sampling that prioritizes plausibility, missing knowledge filled by interpolation, instruction tuning biases toward always-answering. Mitigations: retrieval-augmented generation (ground answers in retrieved sources), citation/attribution prompting, structured outputs (constrained decoding), chain-of-thought + verification, self-consistency, abstention training ("I don't know"), uncertainty signals (logprobs, semantic entropy), and post-hoc fact-checkers (LLM-as-judge or retrieval-based). Frontier models hallucinate less but still do, especially on niche topics, recent events, and adversarial prompts. Hallucination resistance is a key axis of model evaluation alongside reasoning and instruction following.

**Key points:**
- Confident plausible-but-wrong outputs.
- RAG and citations are top mitigations.
- Self-consistency and abstention help.
- Evaluate hallucination as a first-class metric.

---

### 72. Retrieval-augmented generation (RAG)

**Answer:** At query time, retrieve relevant documents from a corpus (typically via vector search over embeddings) and inject them into the LLM prompt as context. Lets the model answer over private, up-to-date, or large corpora without retraining. Pipeline: chunk documents → embed → store in vector DB → at query, embed query, retrieve top-k → optionally rerank → assemble prompt → generate (with citations). Tradeoffs vs fine-tuning: RAG handles freshness and attribution natively, fine-tuning bakes patterns/style into the model. Most production "LLM apps" use RAG. Failure modes: retrieval misses, chunk boundaries cutting context, irrelevant retrievals confusing the model, prompt-injection via retrieved content. Quality of retrieval often matters more than choice of LLM.

**Key points:**
- Retrieval grounds generation in external sources.
- Pipeline: chunk → embed → retrieve → rerank → generate.
- Better than fine-tuning for facts/freshness.
- Retrieval quality usually the bottleneck.

---

### 73. Vector databases and ANN search

**Answer:** Store and index high-dimensional embeddings for fast nearest-neighbor search. Exact search is O(n*d); approximate (ANN) trades small recall loss for orders-of-magnitude speedup. Algorithms: HNSW (hierarchical navigable small world graphs, low-latency, high recall), IVF (inverted file with k-means partitioning, scalable), IVF-PQ (product quantization compresses vectors), ScaNN (Google), FAISS (Meta library, all of the above). Vector DBs: Pinecone, Weaviate, Qdrant, Milvus, pgvector, OpenSearch, Elasticsearch dense vector, Chroma. Choose based on scale, recall requirements, filtering needs (metadata), hybrid search (vector + lexical), and ops model (managed vs self-hosted). For small data (<1M vectors), in-memory FAISS or even brute force may suffice.

**Key points:**
- HNSW: low-latency, high-recall default.
- IVF-PQ for compressed large-scale.
- Hybrid (vector + BM25) often beats pure vector.
- pgvector simple; Pinecone/Qdrant for scale.

---

### 74. Chunking strategies for RAG

**Answer:** Splitting documents into retrievable chunks affects everything downstream. Strategies: fixed-size character/token chunks (simple), recursive splitting (try paragraph, then sentence, then char), semantic chunking (split on embedding-similarity boundaries), structural (headings, sections, code blocks), document-specific (LaTeX, code, tables). Typical chunk size: 200-1000 tokens with 10-20% overlap. Tradeoffs: small chunks give precise retrieval but lose context; large chunks bring more context but dilute relevance and waste tokens. Add metadata (source, section, date) for filtering and citations. Parent-document retrieval embeds small chunks but returns larger surrounding context. Late chunking (Jina) embeds whole document then pools by chunk to preserve global context. Chunking choice can swing RAG quality dramatically.

**Key points:**
- Recursive or semantic chunking beats naive splits.
- Overlap (10-20%) prevents context cuts.
- Parent-doc retrieval bridges precision/context tradeoff.
- Metadata enables filtering and citations.

---

### 75. Reranking in RAG

**Answer:** Initial vector retrieval is fast but coarse; rerankers re-score the top-k candidates with a more accurate (slower) model to improve precision. Cross-encoder rerankers (e.g., BGE-reranker, Cohere Rerank) take (query, doc) as joint input and output a relevance score—much better than bi-encoder cosine similarity at distinguishing fine differences. Typical pipeline: retrieve top-50/100 via vector + BM25 hybrid, rerank with cross-encoder, keep top-5/10 for the LLM. Adds latency (~tens of ms per candidate) but often the biggest quality boost in RAG after retrieval itself. Open-source: BGE-reranker, mxbai-rerank, Jina reranker. Hosted: Cohere, Voyage. LLM-as-reranker (use a small LLM to score) also viable but expensive.

**Key points:**
- Cross-encoder more accurate than embedding similarity.
- Retrieve broad, rerank narrow.
- Often the highest-ROI RAG improvement.
- Adds latency but big precision wins.

---

### 76. Hybrid search: vector + lexical

**Answer:** Pure vector search misses exact-match cases (acronyms, identifiers, rare terms); pure BM25/lexical misses semantic matches. Hybrid search combines both via score fusion: reciprocal rank fusion (RRF, simple and parameter-free, often best in practice), weighted normalized scores, or learned fusion. Most production RAG systems use hybrid because typical queries mix exact terms (product names, error codes) and concepts. Implementations: Elasticsearch/OpenSearch hybrid, Weaviate, Qdrant, Vespa, Milvus. ColBERT (late interaction) is a middle ground that does fine-grained token-level matching with vector efficiency. Hybrid is essentially always better than vector alone in production, with modest infra overhead.

**Key points:**
- Vector for semantics, BM25 for exact tokens.
- RRF is a simple, strong fusion.
- Production default for serious RAG.
- ColBERT: token-level late interaction.

---

### 77. Agents and tool use

**Answer:** LLM agents go beyond single-shot generation by interleaving reasoning, tool calls (search, code execution, APIs), and observation. Patterns: ReAct (reasoning + acting trace), function/tool calling (structured JSON output triggers tool, result fed back), plan-and-execute (planner makes a plan, executor runs steps), reflection (self-critique then revise), multi-agent (specialized agents collaborate). Modern LLMs (GPT-4, Claude, Gemini) expose first-class function-calling APIs. Frameworks: LangChain, LlamaIndex, Anthropic's tool use, OpenAI assistants, AutoGen, CrewAI. Production challenges: latency (many round-trips), cost (long traces), reliability (loops, errors), evaluation (multi-step traces hard to grade), safety (tool misuse). Best for tasks where the right next step depends on previous results.

**Key points:**
- Reason → call tool → observe → repeat.
- Function calling is the standard interface.
- Latency, cost, eval are practical challenges.
- Multi-step adaptive > single-shot for many tasks.

---

### 78. Function calling and structured outputs

**Answer:** LLMs are trained to emit structured outputs (JSON matching a schema) when the user supplies a tool/function spec. Implementation: provide function name, description, JSON schema for parameters; the model decides whether/which to call, emits arguments, and the application executes and returns results for the model to use. Modern providers (OpenAI, Anthropic, Google) offer this natively. For reliability: constrained decoding (force outputs to match grammar/JSON schema via libraries like Outlines, Instructor, OpenAI strict mode), schema validation with retry, examples in the system prompt. Critical for agents, RAG with metadata filters, form filling, ETL from unstructured text. Modes: tool-choice "auto" lets model decide; "required" forces a call; "none" disables.

**Key points:**
- Schema-defined tools; model emits JSON args.
- Constrained decoding ensures valid output.
- Foundation for agents and structured workflows.
- Validate and retry on schema errors.

---

### 79. LLM evaluation: benchmarks and LLM-as-judge

**Answer:** Two categories. Automated benchmarks: MMLU (multitask knowledge), HumanEval/MBPP (code), GSM8K/MATH (math), HellaSwag (commonsense), TruthfulQA (factuality), MT-Bench (chat). Saturated for frontier models; gaming and contamination concerns. Application-specific evals: build a custom test set tied to your task (e.g., "did the RAG answer match the doc?"). LLM-as-judge: use a strong LLM to grade outputs on rubrics, much cheaper than human eval and well-correlated when prompts are careful—but suffers from biases (position, verbosity, self-preference). Best practice: small human-labeled golden set + LLM-as-judge for scale + spot-checks. Track regressions on every model/prompt change. Eval is the most underinvested part of LLM apps.

**Key points:**
- Public benchmarks: useful but saturated/contaminated.
- Custom evals tied to your task matter most.
- LLM-as-judge scales evaluation cheaply.
- Treat eval as a versioned product artifact.

---

### 80. Evaluating RAG systems

**Answer:** RAG quality decomposes: retrieval (did we get the right docs?), generation (did we use them correctly?). Retrieval metrics: recall@k, MRR, NDCG, hit-rate (was a gold doc in top-k). Generation metrics: faithfulness (no hallucination beyond context), answer relevance, answer correctness vs reference. Frameworks: RAGAS, TruLens, DeepEval. Synthetic eval-set generation: ask an LLM to create QA pairs from your docs, then evaluate retrieval + generation against them. Always combine with a small human-curated golden set for high-stakes decisions. Common findings: retrieval is usually the bottleneck; chunking and reranking improvements move metrics more than swapping LLMs. Monitor in production via user feedback signals (thumbs, follow-up clicks).

**Key points:**
- Split retrieval vs generation evaluation.
- RAGAS/TruLens automate common metrics.
- Synthetic + human-golden eval sets.
- Retrieval usually the bottleneck.

---

### 81. Feature stores

**Answer:** Centralized service for storing, serving, and sharing ML features across training and inference. Solves: train/serve skew (features computed differently in training vs production), feature reuse across teams, point-in-time correctness for time-aware features (training labels must use features as they existed at label time, not "now"). Architecture: offline store (warehouse/lake, batch features) for training, online store (key-value, e.g., Redis, DynamoDB) for low-latency serving, both fed by the same feature pipeline. Tools: Feast, Tecton, Hopsworks, Databricks Feature Store, SageMaker Feature Store, Vertex AI Feature Store. Worthwhile when many models share features or point-in-time correctness matters; overkill for one-off models.

**Key points:**
- Prevents train/serve skew.
- Offline (training) + online (serving) stores.
- Point-in-time joins for time-aware labels.
- Worth it past a handful of production models.

---

### 82. Experiment tracking and model registry

**Answer:** Experiment tracking records every training run's code, data version, hyperparameters, metrics, and artifacts so experiments are reproducible and comparable. Tools: MLflow, Weights & Biases, Neptune, Comet, Aim. Model registry stores versioned models with metadata, stage (staging, production, archived), lineage (which run produced it), and approval state. Together they form the foundation of MLOps: every prod model traces to a specific run, dataset, and code commit. Integrate with CI/CD so promoting to production triggers tests, eval, canary deploys. Without tracking, "which model is in prod and how was it trained?" becomes unanswerable—a leading cause of ML org pain.

**Key points:**
- Track code + data + params + metrics + artifacts.
- Registry versions promoted/approved models.
- Reproducibility = lineage from prod back to commit.
- MLflow/W&B are the common defaults.

---

### 83. A/B testing ML models

**Answer:** Compare a candidate model against current production by randomly splitting users/traffic. Define a primary success metric (revenue, retention, CTR) and guardrail metrics (latency, error rate, fairness). Choose sample size for statistical power based on minimum detectable effect (MDE) and expected baseline variance. Run for full business cycles (don't end on Monday for a weekly-cyclical app), check for novelty effects. Use sequential or Bayesian testing to peek safely. Beware: SUTVA violations (network effects), Simpson's paradox across segments, multiple-comparison inflation across many metrics. Always A/B before declaring success—offline metrics frequently disagree with online. Holdout cohorts measure long-term effects beyond short A/B windows.

**Key points:**
- Online > offline; A/B before trusting any model.
- Primary metric + guardrails.
- Power analysis sets sample size.
- Watch SUTVA, novelty, multiple comparisons.

---

### 84. Canary deployment and shadow mode

**Answer:** Risk-reduction patterns for rolling out ML models. Shadow mode: send production traffic to the new model in parallel with the current one, log predictions, compare offline—no impact on users. Catches infra bugs and gross distribution shifts. Canary deploy: route a small percentage (1%, 5%, 25%) of real traffic to the new model, monitor business and guardrail metrics, ramp up if healthy, roll back fast if not. Combine with feature flags for granular control. Especially important for ML because models can fail in subtle, distribution-dependent ways that offline eval misses. Build automated rollback on regression of key metrics. Pair with A/B for statistical evidence of improvement.

**Key points:**
- Shadow: log only, no user impact.
- Canary: small live traffic with auto-rollback.
- Feature flags + metrics + rollback automation.
- Catches what offline eval misses.

---

### 85. Model monitoring and drift detection

**Answer:** Production models silently degrade as inputs shift. Monitor: data drift (input feature distributions vs training), concept drift (relationship between X and y changes), prediction drift (model output distribution shifts), performance drift (accuracy, when ground truth is available with delay). Methods: PSI, KL divergence, Kolmogorov-Smirnov, ADWIN for streaming, image/text embedding drift. Track per-feature and per-segment, not just global. Set alerts with hysteresis to avoid noise. Latency, error rate, and throughput also need monitoring. Tools: Evidently, Arize, WhyLabs, Fiddler, Datadog ML. Drift detection without retraining strategy is just an alarm; pair with automated retraining triggers or human review.

**Key points:**
- Data, concept, prediction, performance drift differ.
- PSI/KL for distributional shift.
- Per-segment monitoring catches localized regressions.
- Pair detection with retraining or human triage.

---

### 86. Batch vs realtime model serving

**Answer:** Batch: compute predictions offline (nightly, hourly) and store in a database/cache for read-out at request time. Simpler, cheaper, scales easily; appropriate when freshness need is hours-to-days (churn scores, recommendations, lead scoring). Realtime/online: model is queried per request, computes prediction synchronously. Needed for fresh inputs (search ranking, fraud, ads, personalization). Architecture: HTTP/gRPC service, autoscaling, p99 latency budgets (often <100ms), model loaded in memory, batch micro-batching for throughput. Hybrid: precompute features in batch, run lightweight realtime model on top. Choose based on latency requirement, input freshness, and cost. Most production ML systems blend both.

**Key points:**
- Batch: cheaper, simpler, hours-of-freshness OK.
- Realtime: per-request, sub-second latency.
- Hybrid: batch features + realtime scoring.
- Latency SLOs drive architecture.

---

### 87. LLM inference engines: vLLM, TGI, TensorRT-LLM

**Answer:** Specialized servers for high-throughput LLM inference. vLLM introduced PagedAttention (KV cache treated like virtual memory pages), enabling 2-24x throughput vs naive serving via better memory utilization and continuous batching (insert/remove sequences from batch as they finish, no waiting for slowest). TGI (Hugging Face Text Generation Inference) is a comparable production server. TensorRT-LLM (NVIDIA) compiles models with kernel fusion, quantization, and graph optimization for max GPU throughput. SGLang adds RadixAttention for prefix sharing. Critical features across the board: continuous batching, paged KV, quantization (INT8/FP8/INT4), speculative decoding, prefix caching, multi-LoRA serving. Choice depends on model, hardware, and operational fit. vLLM is the open-source default for most teams.

**Key points:**
- Continuous batching + paged KV = throughput multiplier.
- vLLM dominant open-source choice.
- TensorRT-LLM for max NVIDIA performance.
- Prefix caching huge for repeated system prompts.

---

### 88. Speculative decoding

**Answer:** Speeds up LLM generation by using a small "draft" model to propose K tokens ahead, then a single forward pass of the large model verifies (or rejects/corrects) the draft in parallel. Accepted tokens come "free"; rejected ones cost no more than vanilla generation. Yields 2-4x speedup with no quality change (output is identical to greedy/temperature sampling from the target). Variants: tree-based (Medusa, multiple proposals per step), self-speculative (use model's own early layers as draft), EAGLE (better draft heads with hidden state input). Critical for low-latency interactive LLM serving. Diminishing returns at high batch sizes (less latency-bound). Now standard in vLLM, TensorRT-LLM, and inference APIs.

**Key points:**
- Draft small, verify big; same output distribution.
- 2-4x speedup typical, no quality loss.
- Medusa/EAGLE are stronger variants.
- Best at low batch (latency-bound).

---

### 89. Continuous batching and paged attention

**Answer:** Static batching pads all sequences to max length and processes them together—wasted compute when sequences finish at different times. Continuous batching (Orca, vLLM) inserts new requests into the batch as soon as others finish a token, dramatically improving GPU utilization for variable-length generation. Paged attention treats the KV cache as fixed-size pages (like OS virtual memory), eliminating fragmentation and enabling efficient memory sharing across requests with common prefixes (system prompts, few-shot examples). Together they enable production LLM serving at 10x+ throughput vs naive approaches. Trade memory management complexity for throughput. Standard in vLLM, SGLang, TGI, TensorRT-LLM.

**Key points:**
- Continuous batching: no idle GPU on short sequences.
- Paged KV: no fragmentation, prefix sharing.
- 10x+ throughput vs naive serving.
- Both standard in modern LLM servers.

---

### 90. Model distillation for production

**Answer:** Compress a large teacher model into a smaller production student. Approaches: standard KD (match logits with temperature), sequence-level distillation (train on teacher's generated outputs), task-specific (train student on teacher's predictions for your task only—often massively better than general distillation). For LLMs: synthetic data from a frontier model (GPT-4, Claude) used to fine-tune a small open model (Mistral 7B, Qwen). Watch licensing (some providers prohibit using outputs to train competing models). Combine with quantization and pruning for max compression. Practical recipe: distill GPT-4 outputs on your domain into Llama-3-8B with LoRA, deploy on a single GPU, get 90%+ of frontier quality at 1% of cost. The dominant productionization path in 2024-2026.

**Key points:**
- Task-specific distillation beats generic.
- Synthetic data from frontier → small student.
- Watch provider TOS on outputs.
- Stack with quantization for max compression.

---

### 91. Edge and on-device ML

**Answer:** Run models on phones, browsers, embedded devices. Constraints: limited memory, compute, battery, no GPU. Stack: TensorFlow Lite, ONNX Runtime, Core ML (iOS), MediaPipe, llama.cpp, MLC-LLM, Apple's Foundation Models, Qualcomm AI Engine. Techniques: quantization (INT8/INT4 default, sometimes binary), pruning (structured for hardware), distillation, mobile-optimized architectures (MobileNet, EfficientNet, MobileBERT), neural architecture search for target hardware. LLMs on-device: 1-8B parameter models at INT4 fit in phone RAM (Phi-3-mini, Gemma 2B, Llama 3.2 1/3B). Benefits: privacy (no data leaves device), offline, low latency, zero per-request cost. Challenges: model size, thermal throttling, OS fragmentation. The 2025-2026 trend is hybrid cloud-edge with smart routing.

**Key points:**
- Tight memory/compute/battery budgets.
- Quantization + small architectures essential.
- 1-8B LLMs viable on modern phones.
- Privacy + offline are key advantages.

---

### 92. GPU efficiency and training cost

**Answer:** Training cost = (model FLOPs * tokens) / (GPU FLOPs * utilization * time). Practical optimizations: mixed precision (FP16/BF16/FP8) for 2-4x speedup, gradient checkpointing trades compute for memory, ZeRO/FSDP shards optimizer/grad/params across GPUs, tensor/pipeline/data parallelism for multi-node, FlashAttention for memory-efficient attention, gradient accumulation for large effective batch. Monitor: MFU (Model FLOPs Utilization), typical 40-55% for transformer training. Frontier training campaigns cost tens to hundreds of millions of dollars; efficiency gains compound. Inference: quantization, batching, paged attention, speculative decoding, multi-LoRA serving. Chinchilla scaling laws guide compute-optimal allocation between model size and training tokens.

**Key points:**
- BF16/FP8 + FlashAttention + FSDP = modern stack.
- MFU is the headline efficiency metric.
- Chinchilla: balance params vs tokens.
- Inference cost dominated by KV/batching/quantization.

---

### 93. Scaling laws and Chinchilla

**Answer:** Kaplan et al. (2020) showed model performance follows power-law scaling in compute, data, and parameters. Chinchilla (Hoffmann et al., 2022) corrected the optimal compute allocation: for a given compute budget C, params N and tokens D should scale roughly equally (D ≈ 20N), making prior "huge model, modest data" runs (GPT-3, PaLM) suboptimal. LLaMA, Mistral, modern models train smaller models on more tokens (LLaMA-3 8B on 15T tokens), which is overtrained vs Chinchilla but better for inference cost. Scaling laws hold across orders of magnitude until data quality dominates. Post-Chinchilla insight: for inference-heavy regimes, training smaller models longer is better than larger models shorter. Scaling laws guide budget allocation in frontier training.

**Key points:**
- Power laws in compute, data, params.
- Chinchilla: ~20 tokens per param at compute-optimal.
- Overtraining smaller models cuts inference cost.
- Quality of data eventually matters more than scale.

---

### 94. Reinforcement learning basics

**Answer:** Agent interacts with environment via actions, receiving observations and rewards; learns a policy pi(a|s) maximizing expected discounted return. Key concepts: state-value V(s), action-value Q(s,a), discount factor gamma, exploration vs exploitation (epsilon-greedy, UCB, entropy bonus), on-policy (PPO, A2C) vs off-policy (DQN, SAC), model-free vs model-based. Algorithms: Q-learning + neural nets = DQN, policy gradient = REINFORCE, actor-critic = A2C/A3C/PPO/SAC. Challenges: sample inefficiency, reward design (sparse rewards, reward hacking), credit assignment, instability. RL succeeded most in games (Atari, Go, StarCraft), robotics with simulation, and LLM post-training (RLHF/PPO, RLVR for reasoning models). Most "useful" production RL is bandits, not full RL.

**Key points:**
- Maximize expected discounted reward via policy.
- PPO is the go-to general-purpose algorithm.
- Sample inefficiency is the chronic problem.
- Bandits often more practical than full RL.

---

### 95. Multi-modal models: CLIP, GPT-4V, Gemini

**Answer:** Multi-modal models process images, text, audio, video jointly. CLIP trained image-text pairs contrastively (matching image embedding with caption embedding from a huge web scrape), enabling zero-shot classification ("which class label is closest in embedding space?") and powering retrieval/captioning. GPT-4V, Claude 3+, Gemini natively accept images and text in a unified context, answering visual questions, OCR, chart reading, code from screenshots. Architecturally most fuse a vision encoder (ViT, CNN) into the LLM via a projector (Q-Former, MLP) before passing to the transformer. Native multimodal training (Gemini, GPT-4o) trains on interleaved tokens of text/image/audio. The 2025-2026 frontier extends to video and real-time speech, with audio-language models (Whisper, GPT-4o voice) becoming first-class.

**Key points:**
- CLIP: contrastive image-text, foundation of retrieval.
- VLMs: vision encoder + projector + LLM.
- Native multimodal (Gemini, GPT-4o) trains jointly.
- 2025-2026 frontier: video, real-time speech.

---

### 96. AI alignment

**Answer:** Ensuring AI systems pursue goals aligned with human values and intent. Subproblems: outer alignment (specifying what we want—reward modeling, constitutional AI, debate), inner alignment (the model actually optimizing what we specified, not a proxy—mesa-optimization, deceptive alignment), and scalable oversight (humans can't directly evaluate superhuman outputs—use AI assistants, debate, recursive reward modeling, weak-to-strong generalization). Practical techniques today: RLHF, DPO, constitutional AI (model critiques itself against principles), red-teaming, evals. Frontier labs (Anthropic, OpenAI, DeepMind, Meta) all have alignment teams. Open questions for advanced AI: deceptive alignment, goal preservation, corrigibility, interpretability. Alignment matters more as models become agentic and capable enough to take consequential actions autonomously.

**Key points:**
- Outer (spec) + inner (optimization) alignment.
- RLHF/DPO/constitutional AI are practical tools.
- Scalable oversight is an open research area.
- Stakes rise with autonomy and capability.

---

### 97. Prompt injection and jailbreaks

**Answer:** Adversarial inputs that manipulate LLMs into bypassing safety guidelines or following attacker instructions. Direct jailbreaks: clever prompts ("ignore previous instructions", DAN, role-play) bypass refusals. Indirect prompt injection: malicious instructions hidden in retrieved documents, web pages, emails, images, where an agent treats them as system instructions. Increasingly dangerous in agentic systems with tool access (exfiltrating data, taking unauthorized actions). Mitigations: system-prompt hierarchy (instruction-following hierarchy, training models to distrust untrusted content), input/output filters, content provenance markers, sandboxed tool use with human-in-the-loop for sensitive actions, structured outputs that constrain behavior, dual-LLM patterns (privileged + sandboxed). No technique is fully reliable yet; defense-in-depth is the only practical answer.

**Key points:**
- Direct (user) vs indirect (retrieved content) injection.
- Agents with tools dramatically raise stakes.
- Instruction hierarchy + filters + sandboxing.
- Treat retrieved content as untrusted by default.

---

### 98. LLM benchmarks: MMLU, HellaSwag, HumanEval, MATH

**Answer:** Public benchmarks tracking LLM capability. MMLU: multitask knowledge across 57 subjects; frontier models hit 90%+ (saturated). HellaSwag: commonsense sentence completion; saturated. HumanEval/MBPP: Python function generation; SWE-Bench: real GitHub issues, much harder. GSM8K: grade-school math word problems; saturated. MATH/AIME: competition math, where reasoning models (o1, R1) shine. ARC-AGI: abstract reasoning, deliberately hard for LLMs. MT-Bench, Arena Hard, Chatbot Arena: chat quality. GPQA: graduate-level science. Open: lots of contamination from training data, overfitting via tuning toward benchmarks. Live leaderboards (LMSys Arena, LiveBench, SimpleBench) reduce contamination via fresh prompts. Trust your application-specific eval over any public benchmark.

**Key points:**
- MMLU, HellaSwag, GSM8K largely saturated.
- SWE-Bench, MATH, GPQA still discriminate frontier models.
- Contamination + benchmark-overfitting are real.
- Your custom eval > public benchmarks.

---

### 99. Responsible AI and bias mitigation

**Answer:** ML models inherit and amplify biases from training data (race, gender, age, geography). Examples: face recognition error rates much higher for darker skin; resume screening favoring male names; medical models trained on one demographic failing on others. Fairness criteria: demographic parity (equal outcomes across groups), equal opportunity (equal TPR), equalized odds (equal TPR and FPR)—often mutually exclusive. Mitigation across the lifecycle: representative data, bias audits, fairness-aware algorithms (reweighting, adversarial debiasing, post-processing), monitoring per-group metrics in production, model cards/data sheets documenting limitations. Regulation: EU AI Act, US executive orders, sector-specific rules. Responsible AI also covers privacy (DP, federated learning), security, transparency, and human oversight. Cannot be retrofitted—bake in from design.

**Key points:**
- Bias compounds through the ML pipeline.
- Fairness metrics often mutually incompatible.
- Per-group monitoring catches localized harm.
- Regulation (EU AI Act) is becoming binding.

---

### 100. Productionizing LLMs end-to-end

**Answer:** A production LLM app combines: model choice (frontier API vs open-weight self-hosted vs distilled small model), prompt engineering + version control, RAG with vector DB + hybrid search + reranking, structured output / function calling, agents/tool use where adaptive control flow is needed, evaluation (automated benchmarks + LLM-as-judge + human golden set + production feedback), guardrails (input/output filters, PII redaction, prompt-injection defense), observability (latency, cost, token usage, error rates, hallucination signals), serving (vLLM/TGI, autoscaling, caching, batching, quantization), continuous improvement (A/B tests, fine-tuning loops, prompt iteration), and cost management (model routing—cheap for easy, expensive for hard). The model is increasingly the cheap commodity; data, evals, retrieval, and ops are where production quality is won or lost.

**Key points:**
- Model is commodity; data + evals + ops differentiate.
- RAG + structured outputs + guardrails are table stakes.
- Observability and eval loops drive improvement.
- Route by difficulty: small models for easy, frontier for hard.
