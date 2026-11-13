---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-030-empirical-evaluation
section_title: "Empirical Evaluation"
section_number: null
pages: 52-53
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Figure 4.4: Sensitivity of PTRRα to α on selected LCDB instances (T = 44, k =
22). Each curve corresponds to one CC-18 dataset d from LCDB 1.1 and reports the nor-
malized cumulative reward E[PTRRα(d)]/OPT(d) as a function of α ∈{0.1, 0.2, . . . , 1.0},
where OPT(d) = maxi
PT
t=1 ri,d(t) is the cumulative reward of the best fixed-arm policy
in hindsight under the same horizon (which is not necessarily the optimal policy due to
absence of monotonicity, but it is a useful proxy.) and ri,d(t) = 1 −erri,d(t) is the mean
(over cross-validation) reward at anchor t for arm i.
For each (d, α), E[PTRRα(d)] is
estimated by averaging over 200 random arm orderings. The shaded regions are pointwise
95% Student-t confidence intervals across the 200 runs (mean ± t0.975,199 · sd/
√
200). The
displayed datasets are selected to illustrate the range of sweep shapes observed across
the full benchmark (near-flat curves, monotone trends, and interior maxima). For most
datasets, performance differences across α are small relative to the confidence intervals,
while a minority show a significant trend across α on this grid. Complete sweeps over all
27 usable datasets are included in Appendix B.3.6.
We provide empirical evidence that the value of α used in running PTRR can af-
fect the cumulative reward using data from a learning curve dataset, LCDB 1.1 (CC-18
benchmarks, [YMV25]).
We map each dataset in the LCDB dataset to an IMAB in-
stance as follows: the k arms are the LCDB learners, the time index corresponds to the
number of samples seen, and the rewards arise from inverting the error rates through
ri,d(t) = 1 −erri,d(t). We average over cross-validation and retain only datasets for which
37
Figure 4.5: Mean LCDB reward curves for three datasets with distinct best α
values on the grid. Each panel overlays the mean reward curves ri,d(t) = 1 −erri,d(t)
across anchors t for all k = 22 arms on a single CC-18 dataset d. The title of each panel
reports the value of α ∈{0.1, 0.2, . . . , 1.0} that maximizes the estimated normalized
cumulative reward E[PTRRα(d)]/OPT(d) at horizon T = 44 on that dataset. We selected
these datasets to illustrate diverse best α values on the grid. Qualitatively, these plots
suggest a mechanism consistent with the influence of α on PTRRα, where datasets
preferring smaller α tend to exhibit early separation between ‘good’ and ‘bad’ arms
(making aggressive abandonment beneficial).
the curve is defined for all t ∈{1, . . . , T} . This yields 27 datasets with k = 22 arms each
and a time horizon of T = 44. We run PTRRα for each α ∈{0.1, 0.2, . . . , 1.0} and report
normalized cumulative reward E[PTRRα(d)]/OPT(d) (the reciprocal of the competitive
ratio in Definition 2.2) averaged over 200 seeds. Figure 4.4 shows that the α value maxi-
mizing this quantity varies across datasets. Figure 4.5 plots mean reward curves for three
datasets to help visualize the underlying reward dynamics. Full details of the setup and
results are provided in Appendix B.3.6.
4.4
