---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-107-full-empirical-evaluation
section_title: "Full Empirical Evaluation"
section_number: null
pages: 148-151
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
The main phenomenon highlighted by the theory is that the parameter α controls the
exploration–abandonment tradeoff, and therefore that the best α can depend on the un-
derlying instance. The purpose of this empirical section is to provide evidence on real
learning-curve data that different instances prefer different α. We use sample-wise learning
curves from the Learning Curve Database (LCDB 1.1), specifically the CC-18 benchmarks.
LCDB stores error-rate curves at multiple training-set sizes (“anchors”) for a fixed set of
learners, together with repeated evaluations under a nested cross-validation protocol.
Each dataset d defines one improving-bandit instance.
Arms correspond to learn-
ers, and the time index corresponds to LCDB anchor points. We convert error rates to
rewards through ri,d(t) = 1 −erri,d(t), so that larger rewards correspond to better per-
formance. LCDB stores multiple repetitions per (dataset, learner, anchor) due to nested
cross-validation. We average across these repetitions (ignoring missing values) to obtain a
single mean learning curve per (dataset, learner). This yields deterministic reward func-
tions ri,d(·), matching our setting.
LCDB curves can terminate early for some dataset–learner pairs (in the stored tensors
this appears as NaNs). For a fixed horizon T, we restrict to datasets for which all in-
cluded learners have finite values for anchors t = 1, . . . , T. This ensures that each dataset
corresponds to a well-defined bandit instance with a common horizon.
For each usable dataset d and each α on a fixed grid, we run PTRRα for a horizon of T
133
pulls. The only randomness in our implementation is the random ordering in which arms
are first considered. We average results over 200 random seeds. We evaluate performance
using the normalized cumulative reward
E[ALG(d; α)]
OPT(d)
where
OPT(d) = max
i
T
X
t=1
ri,d(t),
which is the reciprocal of the competitive ratio OPT/E[ALG] from Definition 2.2. Note
that OPT(d), the best fixed-arm policy on d in hindsight, is not necessarily the global
best policy here due to the absence of monotonicity.
Main experiment: T = 44, k = 22.
Our primary experiment uses horizon T = 44 and
a learner set of size k = 22 (we exclude two learners with ≥50% ill-behavior in the CC-18
file). Under this choice, we obtain 27 datasets with complete prefixes of length T across
all k learners.
134
Figure B.1: Sensitivity of PTRRα to α on all LCDB instances (T = 44, k = 22).
Each curve corresponds to one CC-18 dataset d from LCDB 1.1 and reports the nor-
malized cumulative reward E[PTRRα(d)]/OPT(d) as a function of α ∈{0.1, 0.2, . . . , 1.0},
where OPT(d) = maxi
PT
t=1 ri,d(t) is the cumulative reward of the best fixed-arm policy
in hindsight under the same horizon (which does not necessarily correspond to the global
optimal policy due to the absence of monotonicity) and ri,d(t) = 1 −erri,d(t) is the mean
(over cross-validation) reward at anchor t for arm i.
For each (d, α), E[PTRRα(d)] is
estimated by averaging over 200 random arm orderings. The shaded regions are pointwise
95% Student-t confidence intervals across the 200 runs (mean ± t0.975,199 · sd/
√
200). For
most datasets, performance differences across α are small relative to the confidence inter-
vals, while a minority show a significant trend across α on this grid.
We sweep α ∈{0.1, 0.2, . . . , 1.0}.
Figure B.1 shows all of the per-dataset perfor-
mance curves α 7→E[ALG]/OPT, demonstrating that the maximizer varies across certain
instances. Across the 27 datasets, the best α is widely distributed: 11 datasets select
α = 0.1, while many others select α in the range [0.8, 1.0] (it is worth noting that 4 of
the 11 cases are actually flat across several small α values). Mechanistically, smaller α
corresponds to more aggressive early abandonment in PTRRα, so these datasets are those
for which aggressive abandonment is (on this grid) empirically most favorable.
135
Figure B.2: Mean LCDB reward curves for three datasets with distinct best α
values on the grid. Each panel overlays the mean reward curves ri,d(t) = 1 −erri,d(t)
across anchors t for all k = 22 arms on a single CC-18 dataset d. The title of each panel
reports the value of α ∈{0.1, 0.2, . . . , 1.0} that maximizes the estimated normalized cumu-
lative reward E[PTRRα(d)]/OPT(d) at horizon T = 44 on that dataset. We selected these
datasets to illustrate the reward dynamics underlying distinct best α values on the grid.
Naturally, real learning curves in LCDB are not guaranteed to satisfy the monotonic-
ity/concavity assumptions used in this work (and largely don’t). To connect α to concrete
learning dynamics, we plot mean learning curves with fixed axes for three datasets with
distinct best α’s. Figure B.2 displays all learners for dataset 19 (which selects α = 0.1),
dataset 16 (which selects α = 0.7) and index 67 (which selects α = 1.0). Qualitatively,
these plots suggest a mechanism consistent with the influence of α on PTRRα, where
datasets preferring smaller α tend to exhibit early separation between ‘good’ and ‘bad’
arms (making aggressive abandonment beneficial), while datasets preferring larger α ex-
hibit closer early performance among many learners (making aggressive abandonment
riskier). We emphasize that this interpretation is qualitative and based directly on the
plotted mean curves; the purpose of these plots is merely contextualize the observed in-
stance dependence.
B.4
