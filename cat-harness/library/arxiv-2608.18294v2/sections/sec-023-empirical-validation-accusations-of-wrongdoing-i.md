---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-023-empirical-validation-accusations-of-wrongdoing-i
section_title: "Empirical Validation: Accusations of Wrongdoing in China"
section_number: null
pages: 25-26
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Pan and Chen (2018) study whether Chinese officials conceal online complaints that accuse local
officials of wrongdoing. We treat the expert-coded indicator of prefecture-level wrongdoing as the
latent independent variable and upward reporting as the downstream dependent variable. The main
estimand is the coefficient on prefecture-level wrongdoing in a logistic regression of upward reporting
on the latent indicator and a subset of the covariates (7 binary and 1 continuous) used in the original
application. The analysis contains 1,412 complaints and uses the LLM annotations as proxy labels.
We use three LLM labels in this study: GPT-4.1 5-shot, GPT-4 5-shot, and Llama-4 0-shot.
We compare (a) the DMM estimator using the robust bridge without access to the gold-standard
labels, (b) three naive regressions that replace the latent variable with one proxy at a time, and (c)
DSL using a simple random sample of 500 gold-standard labels (35% of the sample). We evaluate
them against the oracle logistic regression that uses the gold-standard labels for all units. Importantly,
in this empirical validation, we use the real-world data and do not simulate any data. Therefore,
this is a realistic evaluation of the DMM estimator because we do not know whether the condi-
tional independence assumption required in the DMM estimator holds, as in the real-world empirical
application.
Panel (a) of Figure 2 reports the point estimates and 95% confidence intervals. The gold-standard
benchmark for the prefecture-wrongdoing coefficient is −1.039. Despite their similarly high reported
class-weighted F1 scores, the three naive estimates range from −1.869 to −0.388 and all of them are
biased. DSL and DMM estimate the coefficient to be −1.279 and −0.844, respectively, and both
confidence intervals contain the benchmark estimate. Importantly, unlike DSL, DMM obtains its
estimate without using any gold-standard labels.
Panel (b) reports empirical coverage based on 500 resamples. Specifically, it shows the proportion
25
0.00
0.05
0.10
0.15
0.20
0.25
3
4
5
6
7
8
9
10
11
12
13
14
15
Number of proxy labels
Bias
DMM
Naive majority vote
(a) Bias
0.05
0.10
0.30
3
4
5
6
7
8
9
10
11
12
13
14
15
Number of proxy labels
RMSE (log scale)
(b) RMSE
0.0
0.5
1.0
3
4
5
6
7
8
9
10
11
12
13
14
15
Number of proxy labels
Coverage
(c) 95% CI coverage
0.0
0.2
0.4
0.6
0.8
1.0
3
4
5
6
7
8
9
10
11
12
13
14
15
Number of proxy labels
F1
(d) Proxy F1
Figure 1: Simulation comparing DMM with naive majority voting as the number of proxy labels
increases. Panels (a)–(c) report bias, RMSE, and 95% confidence-interval coverage over 500 replica-
tions; Panel (d) reports proxy F1 scores. Dashed lines mark the oracle benchmarks.
of 95% confidence intervals that contain the benchmark estimate. The three naive estimators have
coverage rates ranging from 0.154 to 0.572, whereas DSL and DMM have coverage rates of 0.981 and
0.862, respectively.
7
