---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-034-monte-carlo-simulations
section_title: "Monte Carlo Simulations"
section_number: null
pages: 44-45
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Data, annotation task, and downstream target.
The annotation task follows the Wesleyan
Media Project codebook used in Fowler et al. (2021): an ad is classified according to whether its
primary purpose is to promote a candidate, attack a candidate, or contrast candidates. We convert
each LLM response into the binary indicator that the ad is classified as Promote. The observed
covariates are the Facebook indicator Ti, party, incumbency status, and office type.
Categorical
variables are represented by dummy indicators in both the calibration models and the EM model.
The complete-case expert Promote prevalence is 0.756. The three highest-ranked labels are GPT-4
multi 6-shot, GPT-4 multi 3-shot, and GPT-4 instruction 6-shot, with F1 scores of approximately
0.950, 0.942, and 0.933, respectively.
Let Y ∗
i denote the expert-coded Promote indicator and define
ri = (1, Ti, W ⊤
i )⊤.
The downstream working model is
Pr(Y ∗
i = 1 | Ti, Wi) = expit(r⊤
i β∗),
(C.6)
and the coefficient on Ti is the target. Fitting equation (C.6) to all expert labels in the complete-case
sample gives the calibration target β∗
FB = 1.3141.
Calibration of the data-generating process.
We hold the 12,973 observed covariate rows fixed.
We first fit equation (C.6) to obtain
bπcal
i
= expit(r⊤
i bβcal).
For each proxy label j and expert class a ∈{0, 1}, we separately fit
Pr(Y (j)
i
= 1 | Y ∗
i = a, Ti, Wi) = expit(r⊤
i γj,a),
(C.7)
using the original expert and LLM labels. These calibration models are ordinary logistic regressions
with probability clipping for numerical stability. Let bηcal
ij,a denote the fitted probabilities.
In replication b, we draw
Y ∗,b
i
∼Bernoulli(bπcal
i ),
44
Y (j),b
i
| Y ∗,b
i
= a, Ti, Wi ∼Bernoulli(bηcal
ij,a),
j = 1, . . . , J,
with the proxy draws mutually independent across j conditional on (Y ∗,b
i
, Ti, Wi). Hence the conditional-
independence restriction holds exactly in the simulated population. Moreover, the EM estimator uses
the same logistic family as the calibration model, so its nuisance working models are correctly speci-
fied. The feasible estimators use only (eY b
i , Ti, Wi); Y ∗,b
i
is supplied only to the infeasible oracle.
Proxy sets and comparison estimators.
The binary Promote proxy labels are ranked by their
F1 score against the original expert labels. We use the nested proxy counts displayed in Figure 1.
Because both the number and the quality of the included proxies change as the set expands, this
exercise should be interpreted as adding progressively weaker proxies, not as holding proxy quality
fixed while varying J.
For a set of size J, define Sb
i = PJ
j=1 Y (j),b
i
. The naive majority-vote outcome is
ˇY b
i = 1{Sb
i > J/2} + Bb
i 1{Sb
i = J/2},
Bb
i ∼Bernoulli(1/2),
where the auxiliary tie-breaking draws are independent across tied samples and Monte Carlo repli-
cations. The naive estimator fits the same logistic regression as equation (C.6) after replacing Y ∗,b
i
with ˇY b
i . DMM uses the same J proxies but constructs bHR
i
based on nuisance components fitted
with the aforementioned EM algorithm and solves equation (C.4). The oracle fits the downstream
logit using Y ∗,b
i
. Each proxy-count cell uses 500 Monte Carlo replications.
For an estimator m, the reported summaries are
Bias(m) =
1
500
500
X
b=1
(bβm,b −β∗
FB),
RMSE(m) =
(
1
500
500
X
b=1
(bβm,b −β∗
FB)2
)1/2
,
Coverage(m) =
1
500
500
X
b=1
1{β∗
FB ∈bC95%
m,b }.
Additional results.
The three expert-coded tone indicators differ substantially in prevalence: Pro-
mote accounts for 75.6% of advertisements in the complete-case sample, whereas Contrast accounts
for 17.2% and Attack for only 7.1%. We repeat the same application-calibrated simulation separately
for the two less prevalent indicators, recalibrating the latent-outcome and proxy models for each out-
come. The target Facebook coefficients are −1.029 for Contrast and −1.334 for Attack. Table C.2
shows that DMM performs especially well for Attack: across the top-3 through top-7 sets, its bias
remains close to zero, coverage ranges from 0.942 to 0.962, and its RMSE falls from 0.113 to 0.085,
approaching the oracle RMSE of 0.076. The corresponding naive estimators are substantially biased
and severely undercover. Contrast shows similar results.
C.4
