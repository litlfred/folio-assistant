---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-005-25-inherent-biases-in-sensitivity-metrics
section_title: "Inherent biases in sensitivity Metrics"
section_number: 2.5
pages: 5-5
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
Sensitivity based explainers E like LIME are highly sensitive to
hyperparameters. This facilitates adversarial fairwashing attacks
(section 4.1) [54] and can cause feature importances to switch arbi-
trarily from highly positive to highly negative [40, 49]. Sensitivity
analysis based evaluation metrics 𝑞suffer similar problems.
Metrics like PGI and PGU may simply encode a preference for
particular explainers. We formalize this in the context of synthetic
data. Consider a wide range of explainability measures that measure
some loss, ℓ, defined in terms of the fidelity 𝐹to classifier responses
𝑚(·), in a synthetic neighborhood Nx around each datapoint x.
ℓ=
1
|X|
∑︁
x∈X
∑︁
𝑛∈Nx
𝐹(𝑚(𝑛), ˆ𝑐x(𝑛))
(1)
ˆ𝑐x(𝑛) is typically defined as something analogous to a first-order
Taylor expansion about x, taking the form ˆ𝑐x(𝑛) = 𝑚(x) +𝐼· (𝑛−x),
where instead of 𝐼being the gradient of function 𝑚, it is the per-
datapoint and per-feature importance returned by explainer E.
However, as per datapoint feature importance is typically com-
puted by fitting a simple linear model over the synthetic points
[48], we can simply consider a new feature-importance explanation
method given by the per-point minimizer, thereby matching the
explanation evaluation metric exactly:
𝐼′(x) = arg min𝐼
∑︁
𝑛∈Nx
𝐹(𝑚(𝑛),𝑚(x) + 𝐼· (𝑛−x))
(2)
By definition, this is an optimal minimizer of (1), and will perform
best with respect to the metric. As trivial examples of this: When 𝐹is
the squared loss, if N is defined in terms of homogeneous Gaussian
noise then (2) corresponds to the definition of LIME [39]; as the
variance of the Gaussian tends to 0, it corresponds to the gradient
of the function; and it corresponds to SHAP, if N is chosen as
weighted sampling over the vertices of a cube formed by swapping
the values of a particular datapoint 𝑝with the distribution mean.
Existing sensitivity based metrics such as PGI define 𝐹using 𝐿1
loss, with neighborhood N defined using a Gaussian distribution
around datapoint x. While the loss is 𝐿1 and not 𝐿2, this formula-
tion is otherwise interchangeable with LIME, and also converges
to the gradient as the variance of the Gaussian tends to 0. This
naturally promotes explainers that satisfy this definition of fidelity
and neighborhood, violating the on-manifold evaluation principle.
3
