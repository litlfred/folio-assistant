---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-008-32-illustrative-example
section_title: "Illustrative Example"
section_number: 3.2
pages: 6-7
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
Intuitively, AXE uses k-NN models because we want important
features to be those that separate model predictions in feature
space. Conversely, unimportant inputs should be unable to separate
the model predictions from each other. To illustrate the intuition
behind the choice of k-NN models in AXE , we present a motivating
example. Consider a dataset consisting of input features 𝑋1 and 𝑋2,
sampled from 4 Normal distributions illustrated in figure 4.
The data (5000 points each) is sampled from 4 Normal distri-
butions N𝑄, N𝑅, N𝑆, and N𝑇, with varying covariances, respec-
tively centered at 𝑄= (2, 2), 𝑅= (−2, 2), 𝑆= (−2, −2), and
𝑇= (2, −2). Model 𝑚makes predictions using only input feature
𝑋1, independent of feature 𝑋2. By construction, for all non-outliers
we can assume: 𝑚(x𝑞) = 1∀x𝑞∼N𝑄, 𝑚(x𝑟) = 0∀x𝑟∼N𝑅,
𝑚(x𝑠) = 0∀x𝑠∼N𝑆, and 𝑚(x𝑡) = 1∀x𝑡∼N𝑇. Explanation
e𝑎= [𝑖𝑎1,𝑖𝑎2] has 𝑖𝑎1 > 𝑖𝑎2 (𝑋1 is more important), and expla-
nation e𝑏= [𝑖𝑏1,𝑖𝑏2] has 𝑖𝑏1 < 𝑖𝑏2 (𝑋2 is more important). Ideally,
metric 𝑞should correctly assign a higher score to an explanation e𝑎:
𝑞(e𝑎) > 𝑞(e𝑏). For e𝑎(and e𝑏), the PGI perturbation neighborhood
is Δ𝑎(and Δ𝑏) and the AXE k-NN neighborhood is 𝜂𝑎(and 𝜂𝑏)
along the respective axes 𝑋1 (and 𝑋2) respectively. In practice, the
Δ and 𝜂neighborhoods are very similar.
−3
−1
1
3
X1
−3
−1
1
3
X2
positive (X1 > 0)
negative (X1 < 0)
Q
R
S
T
ηa
Δb
Figure 4: Synthetic Data and Model for AXE and PGI evalu-
ations: 4 Normal distributions representing the data distri-
bution, and neighborhoods Δ and 𝜂for PGI and AXE respec-
tively. The model is defined as 𝑚(x) = 1𝑋1>0, and we compare
the quality of competing explanations e𝑎(𝑋1 is more impor-
tant) and e𝑏(𝑋2 is more important) for datapoint 𝑄.
We restrict our illustrative analysis to explanations for a single
datapoint 𝑄= (2, 2). From the definition of model 𝑚, it is clear that
𝑋1 should be more important that 𝑋2, and consequently e𝑎better
than e𝑏. Upon examination, this can easily be verified to be the case
for AXE𝑛=1. Consider e𝑏where 𝑋2 is the more important feature.
A nearest neighbor model finding neighbors for 𝑄considering only
𝑋2 and ignoring 𝑋1 (per the AXE definition) will find datapoints
in the k-NN neighborhood 𝜂𝑏for point 𝑄and feature 𝑋2. This
would include points x𝑞, and x𝑟, but not x𝑠or x𝑡. Predictions from
these points can be either 1 or 0 respectively, hence the nearest
neighbor model will have both labels in its neighbors, predicting
an average near 0.5. This implies poor accuracy in recovering the
positive prediction 𝑚(𝑄), leading to a low AXE score (∼0.5, see
figure 5 a). On the other hand, for explanation e𝑎, since 𝑋1 is the
important feature, the neighborhood 𝜂𝑎will include points from
x𝑞and x𝑡. These are all predicted to fall in the positive class, thus
recovering 𝑚(𝑄) with perfect accuracy of 1.0 and leading to a high
AXE score (∼1.0, see figure 5 a). Figure 5 (a) plots AXE𝑛=1(e𝑎)
and AXE𝑛=1(e𝑏) for different 𝑘values for the k-NN models in AXE,
clearly showing AXE 𝑛(e𝑎) > AXE 𝑛(e𝑏) for all hyperparameter
values of 𝑘.
Evaluating Model Explanations without Ground Truth
FAccT ’25, June 23–26, 2025, Athens, Greece
100
101
102
103
104
Number of Nearest Neighbours
0.0
0.2
0.4
0.6
0.8
1.0
AXE Explanation Quality
q(eb)
q(ea)
(a) AXE: AXE relaibly shows that explanation e𝑎is better than explanation e𝑏.
AXE 𝑛=1(e𝑎) > AXE 𝑛=1(e𝑏)∀𝑘∈(1, 10000).
0
1
2
4
8
Perturbation Width
0.0
0.1
0.2
0.3
0.4
0.5
0.6
0.7
PGI Explanation Quality &
Prob(On-manifold Perturbation)
q(eb)
q(ea)
P(Δ ⊆)
P(Δ ⊆)
(b) PGI: PGI𝑛=1(e𝑎) > PGI𝑛=1(e𝑏) only once the perturbations are large, where
on-manifold probability 𝑃(Δ ⊆M) is low.
Figure 5: Comparing explanations using AXE and PGI: By definition 𝑞(e𝑎) > 𝑞(e𝑏), but PGI does not clearly show this. AXE
correctly determines that explanation e𝑎is better than e𝑏, across hyperparameter values. (Both X axes on symlog scale).
We now analyze the behavior of PGI. For e𝑏, PGI would generate
datapoints (2.0, 2.0+𝛿),𝛿∼N (0, width). Varying 𝑋2 has no impact
on the model prediction (by definition), yielding a prediction gap of
0. Conversely, for e𝑎, PGI would sample datapoints (2.0+𝛿, 2.0),𝛿∼
N (0, width). The predictions for these are highly sensitive to the
neighborhood Δ𝑎, the the PGI sampling width. This hyperparameter
determines whether the neighborhood stays on the same side of
the decision boundary 𝑋1 = 0. If it does, then PGI is 0 – a result that
provides no information to compare e𝑎and e𝑏. Figure 5 (b) shows
that PGI is zero until the neighborhood becomes large enough.
However large neighborhoods present a different challenge – the
points PGI samples are more likely to lie off manifold. Figure 5 (b)
also shows the corresponding probability of the PGI perturbations
lying on manifold, and it can be seen that in the "useful" non-zero
range of the plot, on-manifold probabilities are lower. In general,
it is difficult to tune the neighborhood width hyperparameter in
sensitivity analysis [40, 49]. Tuning this hyperparameter requires
knowing apriori what explanations to expect – an implausible
expectation akin to knowing “ground-truth” explanations. Lastly,
figure 5 (b) shows that PGI is unstable even in regions of high
perturbation width, further complicating its use in practice.
AXE does not require model predictions on off-manifold data.
AXE also does not need access to ground-truth explanations. This
is enabled by using k-NN model accuracy to measure explanation
quality – fitting a different k-NN model for each unique expla-
nation and datapoint. Critically, using k-NN models provides a
number of advantages. k-NN models operate on the classifier data
itself, omitting the need for off-manifold predictions, satisfying
the on-manifold evaluation principle. Further, the choice of near-
est neighbor models directly captures the notion of separability in
feature space – capturing the idea that an important feature is one
that separates classes in feature space.
4
