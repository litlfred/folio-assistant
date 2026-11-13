---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-022-simulation-study-platform-differences-in-politic
section_title: "Simulation Study: Platform Differences in Political Advertising Tone"
section_number: null
pages: 24-25
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Fowler et al. (2021) compare the tone of political advertisements on Facebook and television. We use
the expert-coded “Promote” indicator as the latent dependent variable and target the coefficient on
the Facebook indicator in an ad-level logistic regression adjusting for party, incumbency status, and
office type. We hold the observed covariates for 12,973 advertisements fixed and simulate the latent
outcome and proxy label models so that the resulting distributions are similar to the distribution
of the original expert labels and LLM annotations. Please see Section 5 of Egami et al. (2026) for
details on these data. In each simulation run, we generate imperfect measurements independently
conditional on the latent outcome and covariates so that the conditional independence assumption
holds by construction and the conditional classification rate model used by DMM is correctly specified.
The target Facebook coefficient is 1.314, and we conduct 500 Monte Carlo replications.
To evaluate the impact of increasing the number of proxies, we rank the proxy labels by their F1
scores against the original expert labels and construct nested proxy sets by adding labels one at a
time in decreasing order of F1 score. For each number of labels J, the naive estimator replaces the
latent outcome with the majority vote among the J proxy labels. When J is even, ties are resolved
24
by random draw.
DMM instead combines the multiple imperfect labels using the robust bridge
function for downstream inference. We compare both estimators with the infeasible oracle estimator
that assumes access to gold-standard labels. We report bias, root mean squared error (RMSE), and
empirical coverage of nominal 95% confidence intervals.
Figure 1 shows the results. As repeatedly found in the literature, ignoring measurement errors
leads to substantial bias even when the individual proxy labels have high F1 scores. With the top
three proxies, the naive majority-vote estimator has bias 0.186, coverage 0.018, and RMSE 0.191.
However, using the same three imperfect labels, DMM can explicitly provide debiased inference:
DMM has bias 0.002, coverage 0.948, and RMSE 0.063, compared with an RMSE of 0.045 for the
oracle benchmark estimate. Thus, DMM reduces RMSE by approximately two thirds relative to
majority voting and restores the valid confidence interval (i.e., the empirical coverage is nearly the
nominal level).
Figure 1 also shows how DMM behaves as additional proxies are introduced. Across the evaluated
proxy sets, DMM’s bias remains between 0.002 and 0.003, and its coverage remains between 0.946
and 0.962. By contrast, the majority-vote estimator has bias between 0.085 and 0.226, with coverage
ranging from 0 to 0.538. Even with 15 proxy labels, majority voting has bias 0.085, coverage 0.538,
and RMSE 0.096, while DMM has bias 0.002, coverage 0.946, and RMSE 0.047.
Additional informative labels also improve the precision of DMM. Its RMSE falls from 0.063 with
three labels to 0.053, 0.048, and 0.047 with the top 5, 7, and 10 labels, respectively, and reaches 0.046
with 13 labels, close to the oracle RMSE of 0.045. These gains eventually flatten as progressively
weaker labels are added. Thus, additional sufficiently informative labels can narrow the precision
gap between DMM and the oracle infeasible benchmark estimator that observes the latent variable
for all units, but not every additional label is beneficial.
6.2
