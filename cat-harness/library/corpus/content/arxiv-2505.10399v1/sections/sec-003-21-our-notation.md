---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-003-21-our-notation
section_title: "Our Notation"
section_number: 2.1
pages: 2-4
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
We specify our notation from figure 2: input vector x, model 𝑚,
and explanation e. We use these to define an explanation “quality”
metric 𝑞and an evaluation framework 𝑄here, and in algorithm 1
we implement such a framework using AXE.
(1) Input Vector: The input feature vector for any arbitrary dat-
apoint is defined as: x = [𝑥1,𝑥2, . . . ,𝑥𝑁] ∈R𝑁, where 𝑁is
the number of features, and each 𝑥𝑖is a real-valued feature.
Evaluating Model Explanations without Ground Truth
FAccT ’25, June 23–26, 2025, Athens, Greece
(2) Model and Prediction: The model 𝑚is a mapping from the
feature space to a binary output: 𝑚: R𝑁→{0, 1}, and the
prediction for input x is given by: 𝑚(x) = 𝑦pred ∈{0, 1}.
(3) Explanation: A local feature importance explanation is de-
noted e. It is a function of the input x and model 𝑚(im-
plicitly model prediction 𝑚(x) too). For an explainer E,
e = E(x,𝑚), where e ∈R𝑁, and each component 𝑒𝑖repre-
sents the (signed) contribution or importance of the feature
𝑥𝑖to the prediction 𝑚(x).
(4) Explanation Quality Metric: For dataset X, the explanation
quality metric 𝑞∈[0, 1] evaluates the quality of explanation
e for a specific input x and model 𝑚. As a function, 𝑞=
𝑞X(x,𝑚, e) where 0 ≤𝑞≤1 (greater 𝑞is better). Previous
work often refers to quality scores as fidelity or explanation
faithfulness [8, 23, 35].
An explanation evaluation framework is a tuple (X,𝑚, E,𝑄):
• X ∈R𝜈×𝑁is the dataset of inputs with 𝑁features and 𝜈
datapoints, X = {x1, x2, . . . , x𝜈}.
• 𝑚: R𝑁→{0, 1} is the model being explained.
• E : R𝑁→R𝑁is the explanation method that generates
explanation e ∈R𝑁for each datapoint x ∈R𝑁.
• 𝑄is the aggregate quality score over the dataset computed
as an average of explanation quality 𝑞:
𝑄(X,𝑚, E) = 1
𝜈
𝜈
∑︁
𝑖=1
𝑞(x𝑖,𝑚, E(x𝑖,𝑚), X).
2.2
Three Principles for Evaluating Model
Explanation Quality
Variations in explanations occur for many reasons. For example:
(a) different input datapoints x1 ≠x2 typically have different ex-
planations; (b) different prediction models 𝑚1 ≠𝑚2 – eg. with
updated neural network weights – typically have different expla-
nations; and (c) as seen in figure 1, explanations from different
explainers can have different explanations, possibly due to varying
off-manifold input sensitivity of the model 𝑚in the neighborhood
of x. An evaluation framework that cannot distinguish between
explanations from these varying scenarios and always scores di-
verse explanations the same is not helpful. We characterize these
situations respectively with the following principles:
(1) Local Contextualization: Explanations should depend on
the datapoint being explained. For local explanations, when
the datapoint x changes, the evaluation metric 𝑞should not
always prefer that the corresponding explanation e remain
unchanged. Model behavior is not always identical across
the data distribution.
(2) Model Relativism: Explanations should depend on the model
being explained. When the model 𝑚changes, the evaluation
metric 𝑞should not always prefer that the corresponding
explanation e remain unchanged.
(3) On-manifold Evaluation: Explanations on-manifold should
not depend on changes in off-manifold model behavior. When
off-manifold model predictions 𝑚(x + 𝛿x) change, the evalu-
ation metric 𝑞should remain unchanged for explanation e.
Evaluation metrics should not make the same assumptions
as the explainers they seek to evaluate – which often as-
sume changes in output caused by synthetic perturbations
in particular model inputs indicate the importance of those
inputs.
The on-manifold evaluation principle is motivated by the obser-
vation that many explanation methods are variants of sensitivity
analysis that capture how much synthetically varying a particular
feature alters model outputs [17, 29, 46]. Ideally, an explanation
for model behavior on datapoint x1 should not depend on model
Table 1: Explanation Evaluation Metrics: Definitions for ground-truth based explanation evaluation metrics: FA, RA, SA, SRA,
RC and PRA [2, 31] (e is an explanation, and e∗is the ground truth); sensitivity based metrics PGI and PGU [2, 14, 43]; and AXE.
For each we list whether it satisfies the three evaluation principles laid out in section 2.2. * For PGU, lower values are better
Metric
Definition
Local
Contextualization
Model
Relativism
On-Manifold
Evaluation
FA: Feature Agreement
Fraction of top-n features common between e and e∗.
✕
✕
✔
RA: Rank Agreement
Fraction of top-n features common between e and e∗
with the same position in respective rank orders.
✕
✕
✔
SA: Sign Agreement
Fraction of top-n features common between e and e∗
with the same sign.
✕
✕
✔
SRA: Signed Rank Agreement
Fraction of top-n features common between e and e∗
with the same sign and rank.
✕
✕
✔
RC: Rank Correlation
Spearman’s rank correlation coefficient for feature
rankings from e and e∗.
✕
✕
✔
PRA: Pairwise Rank Agreement
Fraction of feature pairs for which relative ordering
in e and e∗is the same.
✕
✕
✔
PGI: Prediction-Gap on Important
Feature Perturbation
Mean absolute change in model output upon perturb-
ing top-n most important inputs.
✔
✔
✕
PGU*: Prediction-Gap on
Unimportant Feature Perturbation
Mean absolute change in model output upon perturb-
ing top-n most unimportant inputs.
✔
✔
✕
AXE: (ground-truth) Agnostic
eXplanation Evaluation
Predictiveness of the top-n most important inputs in
recovering model output. Defined in section 3.1.
✔
✔
✔
FAccT ’25, June 23–26, 2025, Athens, Greece
Kaivalya Rawal, Zihao Fu, Eoin Delaney, and Chris Russell
behavior on a different datapoint x2 = x + 𝛿x. Further, evaluation
frameworks that capture the fidelity of explanations with respect to
synthetic neighborhoods around real points, are simply encoding
a particular choice of sensitivity analysis without meaningfully
evaluating the explanation quality. Section 2.5 formalizes this.
Previous methods for computing the quality 𝑞of explanation e
have suggested comparing e with a known “ground-truth” vector e∗.
Proposals include one “ground-truth” per datapoint x, unintention-
ally introducing independence from𝑚[1, 57]; or one “ground-truth”
per model 𝑚, introducing independence from x [2, 31]. The latter
case clearly violates local contextualization by comparing each lo-
cal explanation with the same static “ground-truth”, promoting a
holistic global model explanation instead of local explanations that
differ across datapoints. The former case violates model relativism by
computing quality 𝑞for explanation e using an immutable “ground-
truth” e∗, fixed for a given datapoint, regardless of the model used.
With images especially, an explanation is often considered good if
it selects the “correct” region as important in an image – regardless
of whether the model used those features [1, 22, 57]. Section 2.4
showcases these violations in detail.
2.3
