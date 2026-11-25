---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-004-23-prior-approaches
section_title: "Prior Approaches"
section_number: 2.3
pages: 4-5
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
Explanations can be evaluated using any of the evaluation metrics
defined in table 1. Broadly, these fall into two categories:
(1) ground-truth based metrics compare the generated explana-
tions e with ground-truth annotations e∗, either collected by
humans or inferred using a different proxy [20, 21, 44, 51].
These include Feature Agreement (FA), Sign Agreement (SA),
Rank Agreement (RA), Signed Rank Agreement (SRA), Rank
Correlation (RC) and Pairwise Rank Agreement (PRA) [31].
(2) sensitivity based metrics verify model sensitivity to the in-
puts declared important by an explanation [17, 30, 44, 50].
These have been summarized as Prediction Gap on Important
Feature Perturbation (PGI) and Prediction Gap on Unimpor-
tant Feature Perturbation (PGU) [2, 14, 43].
In addition to evaluation metrics 𝑞, we also summarize the most
common explanation methods (explainers) E. We limit ourselves to
post-hoc explainers that produce signed feature importance vectors
as explanations. Many of these are inspired by sensitivity analysis
– measuring how changes in input variables effect changes in the
model response [17, 29, 46]. Both LIME and SHAP sample synthetic
points in the neighborhood of a given datapoint x and fit linear
models to obtain feature importances [36, 48]. Gradient-based meth-
ods compute the gradient of the model output with respect to the
input [53], with several extensions: Smooth Grad [55], Integrated
Gradients [56], and Input × Grad [52]. In our experiments in sec-
tion 4.2, we used the standard OpenXAI benchmark for generating
explanations e and evaluating them using prior metrics 𝑞. [2].
Several user studies have demonstrated that for explanations to
be useful in real-world scenarios, their primary function must be
to help users predict model behavior [4, 7, 9, 12, 25, 45]. AXE is
designed to explicitly operationalize this idea, filling a critical gap in
the literature. While work has referenced the need to move beyond
ground-truth and sensitivity towards predictiveness as a measure
of explanation quality [11, 16, 34], few metrics have implemented
this idea. Some previous instantiations have been used to measure
the quality of explanations in image classification [22, 28], where
model relativism violations are common and egregious [1, 22, 57].
2.4
Invariance of ground-truth Metrics to
Changing Data and Models
Real world situations lack access to an oracle to provide ground-
truth explanations e∗[41, 58]. For linear models, a common reso-
lution adopts the model coefficients as the “ground-truth” for all
datapoints x ∈X in a dataset [2, 31]. As mentioned in section
2.2, comparing with the same e∗∀e ∈𝐸is undesirable for local
explanations and promotes a single explanation across datapoints.
Figure 3 depicts such an example, directly violating the local con-
textualization principle. Consider a model with two input features,
𝑋1 and 𝑋2, and prediction 𝑦, parameterized 𝑦= 𝛽0 + 𝛽1𝑋1 + 𝛽2𝑋2.
For datapoint x feature importances are 𝑖1 and 𝑖2, with explanation
𝑒= [𝑖1,𝑖2]. FA, RA, SA, SRA, RC, and PRA measure explanation
quality by comparing with ground-truth explanation e∗= [𝛽1, 𝛽2]
[31]. Since e∗is constant and independent of x, every explana-
tion is compared against the same tuple [𝛽1, 𝛽2]. This compari-
son takes many forms, with definitions provided in table 1. For
−1
0
1
X1 importance: i1
−1
0
1
X2 importance: i2
(β1, β2)
(a) Rank Agreement: 𝑅𝐴𝑛=2
−1
0
1
X1 importance: i1
−1
0
1
X2 importance: i2
(β1, β2)
(b) Sign Agreement: 𝑆𝐴𝑛=2
−1
0
1
X1 importance: i1
−1
0
1
X2 importance: i2
(β1, β2)
0
0.5
1
e*
(c) Signed Rank Agreement: 𝑆𝑅𝐴𝑛=2
Figure 3: Violations of local contextualization and model relativism: Plots showing explanation quality 𝑞(color) across 𝑖1 and 𝑖2
values for explanation e = (𝑖1,𝑖2). Model 𝑚(x) = 𝛽0 + 𝛽1𝑋1 + 𝛽2𝑋2 has ground-truth e∗= (𝛽1, 𝛽2) = (0.7, 0.3). Diverse explanations e
map to the same quality 𝑞(0, 0.5, or 1), violating local contextualization. Changing the model changes the ground-truth e∗, but
leaves the plots unchanged ∀𝛽1, 𝛽2 where 𝛽1 > 𝛽2 > 0, violating model relativism. Section 2.4 explains these computations.
Evaluating Model Explanations without Ground Truth
FAccT ’25, June 23–26, 2025, Athens, Greece
example, our 𝑁= 2 feature setup implies that for the top 𝑛fea-
tures: FA𝑛=0 = 0, FA𝑛=1 ∈{0, 0.5, 1.0}, and FA𝑛=2 = 1, and that
FA𝑛=1 = RA𝑛=2 = PRA𝑛=2, while RC is undefined.
Plotting evaluation metric 𝑞for all possible explanations 𝑒=
[𝑖1,𝑖2], for an example model with 𝛽1 = 0.7 and 𝛽2 = 0.3, we see
that regardless of the specific value of e, there are regions where the
resulting 𝑅𝐴𝑛=2 is the same (figure 3 a). Similarly, the 𝑆𝐴𝑛=2 is the
same across 𝑖1,𝑖2 regions (figure 3 b) and 𝑆𝑅𝐴𝑛=2 too (figure 3 c).
Concretely, any explanation 𝑒= (𝑖1,𝑖2) such that 𝑖1 > 0, 𝑖2 > 0, and
𝑖1 > 𝑖2 (this is the region labeled 1 in figure 3 c) is guaranteed to have
the same FA, RA, SA, SRA, RC, and PRA. These plots are specific to
our particular model and ground-truth, but display multiple regions
of constant FA, RA, SA, SRA, and PRA values, displaying a violation
of the local contextualization principle. In real world settings, these
metrics would fail to distinguish different explanations from each
other in quality if they belonged to the same region in figure 3.
The same logic demonstrates violations of model relativism. From
table 1 we can see that all ground-truth comparison metrics are
symmetric. The metrics are invariant to changes in e∗, the same way
they are invariant to changes in e. For a given explanation e, and for
any model 𝑚such that 𝛽1 > 𝛽2 > 0, the plots in figure 3 would stay
unchanged. Concretely, while we used model weights (ignoring
𝛽0) 𝑚= (𝛽1, 𝛽2) = (0.7, 0.3), the plots would be unchanged for
𝑚𝑎= (0.99, 0.01), 𝑚𝑏= (0.99, 0.98), and 𝑚𝑐= (0.02, 0.01) – vastly
different models! The importance of 𝑋1 with respect to 𝑋2 ranges
from 1 to ∞in the limit, and it is absurd for an explanation quality
metric 𝑞to be unchanged for these diverse models. In this way, FA,
RA, SA, SRA, RC, and PRA fail the model relativism principle, no
longer distinguishing explanations by quality when the underlying
model changes.
2.5
