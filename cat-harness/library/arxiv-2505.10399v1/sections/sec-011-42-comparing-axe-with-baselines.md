---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-011-42-comparing-axe-with-baselines
section_title: "Comparing AXE with Baselines"
section_number: 4.2
pages: 8-10
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
We performed computational experiments comparing AXE with
prior baselines across four datasets, two models, seven explain-
ers, and all eight prior evaluation metrics from table 1, adopting
the standard OpenXAI benchmark [2], with results presented in
figures 6 and 7. Like OpenXAI, we use the German Credit [27],
COMPAS [32], Adult Income [6], and Home Equity Line of Credit
(HELOC) [18] datasets (X), and run experiments with both linear
regression and neural network models (𝑚). We try the SHAP and
LIME (perturbation based); SmoothGrad, Grad, Input × Grad and
Integrated Gradients (gradient based); and Random explainers (E).
We report results using the FA, RA, SA, SRA, RC, PRA, PGI, and
PGU evaluation metrics (𝑞).
Evaluating Model Explanations without Ground Truth
FAccT ’25, June 23–26, 2025, Athens, Greece
AXE_1
AXE_3
AXE_5
AXE_9
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Neural Net on HELOC Dataset
AXE_1
AXE_3
AXE_5
AXE_9
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Neural Net on COMPAS Dataset
AXE_1
AXE_3
AXE_5
AXE_9
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Neural Net on Adult Income Dataset
Explainer
SHAP
Grad
Integrated Grad
LIME
Smooth Grad
Input × Grad
Random
AXE_1
AXE_3
AXE_5
AXE_9
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Neural Net on German Credit Dataset
Figure 6: Evaluating the Quality of Explanations for Neural Networks: For a fair comparison across evaluation metrics, we
average over the entire dataset and plot their Z-score standardized values. Neural nets have no ground truth explanation e∗, so
the only metrics available are AXE, PGI, and -PGU (PGU inverted so higher values are better). Instead of a particular number of
top-n features, we use the AUC trick from section 3.1. For details see section 4.2.
We compare these baselines with 𝐴𝑋𝐸𝑘𝑛. Instead of selecting a
particular number of top-n features, we use the AUC trick described
in section 3.1 for all evaluation metrics 𝑞. Instead of selecting a par-
ticular value for the k-NN hyperparameter 𝑘, we report results
for several values: AXE1, AXE3, AXE5, and AXE9. Each explainer
type (perturbation, gradient, or random) is denoted with a different
line-style. To compare evaluation metrics with each other, we stan-
dardize the final results for each explainer and evaluation metric
using z-scores, because they may follow different scales. For in-
stance, while ideal explanations for both AXE and PGI have scores
of 1.0, AXE considers uninformative explanations to have values
near 0.5, whereas PGI considers uninformative values to be near 0.
Additionally, we also invert PGU values (denoted as (-)PGU) so that
higher values are better, like the rest of our metrics.
For logistic regression models, we are able to use the ground-
truth evaluation metrics because of the presence of model coeffi-
cients, which we adopt as ground-truth for every datapoint in the
dataset, following previous benchmarks [2, 31]. This approach is
discussed in detail in section 2.4. For neural network models, we are
only able to use sensitivity based metrics PGI and PGU, because of
the lack of ground truth explanations. The results from the logistic
regression comparisons can be seen in figure 7 and from the neural
network in figure 6.
From the plots in figures 6 and 7, the AXE 1, AXE 3, AXE 5, and
AXE 9 metrics can be seen to broadly agree with each other in score,
further reinforcing the intuition from section 3.2 that AXE is fairly
robust to hyperparameter variations. The ground-truth oriented
metrics (FA, SA, RA, SRA, RC, PRA) show significant disagreement
with each other, as has been noted in the literature [5, 31, 39].
Finally, as a simple check for evaluation metric validity, we focus
on the behavior of the Random explainer. Ideally, a good evaluation
framework would clearly and reliably distinguish this explainer
from the others, however this does not seem to be the case for
any previous evaluation frameworks. The sensitivity oriented met-
rics (PGI and PGU) rank the Random explainer particularly well.
This is expected from prior work [49] and from our analysis from
section 3.2 where we uncovered the dependence of PGI values on
FAccT ’25, June 23–26, 2025, Athens, Greece
Kaivalya Rawal, Zihao Fu, Eoin Delaney, and Chris Russell
AXE_1
AXE_3
AXE_5
AXE_9
FA
SA
RA
SRA
RC
PRA
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Log. Reg. on HELOC Dataset
AXE_1
AXE_3
AXE_5
AXE_9
FA
SA
RA
SRA
RC
PRA
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Log. Reg. on COMPAS Dataset
AXE_1
AXE_3
AXE_5
AXE_9
FA
SA
RA
SRA
RC
PRA
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Log. Reg. on Adult Income Dataset
Explainer
SHAP
Grad
Integrated Grad
LIME
Smooth Grad
Input × Grad
Random
AXE_1
AXE_3
AXE_5
AXE_9
FA
SA
RA
SRA
RC
PRA
PGI
(-)PGU
Evaluation Metric
−2
−1
0
1
2
Avg. Evaluation Scores 
 (Standardized: μ = 0, σ = 1)
Log. Reg. on German Credit Dataset
Figure 7: Evaluating the Quality of Explanations for Logistic Regression: For a fair comparison across evaluation metrics, we
average over the entire dataset and plot their Z-score standardized values. We compare AXE with all prior metrics from table 1:
FA, RA, SA, SRA, RC, PRA, PGI, and -PGU (PGU inverted so higher values are better). Instead of a particular number of top-n
features, we use the AUC trick from section 3.1. For details see section 4.2.
the neighborhood perturbation width hyperparameter. This fur-
ther questions the use of feature sensitivity as an effective strategy
to evaluate explanation quality, bolstering the importance of the
on-manifold evaluation principle.
5
