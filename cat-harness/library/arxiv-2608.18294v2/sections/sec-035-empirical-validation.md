---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-035-empirical-validation
section_title: "Empirical Validation"
section_number: null
pages: 45-47
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Data and downstream model.
The analysis uses 1,412 Chinese citizen complaints.
The la-
tent independent variable is the expert-coded indicator X∗
i = 1{prefecture-level wrongdoing}, and
the downstream outcome Yi = SendOrNoti indicates whether the complaint was sent to higher-level
authorities. The expert-coded positive-class prevalence is 0.055, and the mean of Yi is 0.418.
45
Table C.2: Fowler simulation results for the alternative Attack and Contrast tone indicators. Each
cell uses 500 Monte Carlo replications. For naive rows, F1 is the individual proxy’s positive-class F1
score; for DMM rows, it is the median [minimum, maximum] F1 score among the included proxies.
Outcome Estimator / set
F1 summary
Bias Coverage RMSE
Attack
Oracle
—
−0.002
0.954
0.076
Naive: GPT-4 multi, 3-shot
0.651
0.591
0.000
0.594
Naive: GPT-4 multi, 0-shot
0.595
0.890
0.000
0.892
Naive: Llama-2 multi, 6-shot
0.581
0.113
0.410
0.124
DMM: Top 3
0.595 [0.581, 0.651] −0.005
0.958
0.113
DMM: Top 5
0.581 [0.565, 0.651] −0.001
0.962
0.087
DMM: Top 7
0.577 [0.548, 0.651] −0.001
0.942
0.085
Contrast
Oracle
—
0.000
0.952
0.050
Naive: GPT-4 multi, 3-shot
0.665
−0.275
0.000
0.280
Naive: GPT-4 multi, 0-shot
0.658
−0.308
0.000
0.312
Naive: Llama-2 instruction, 6-shot
0.511
−0.144
0.340
0.155
DMM: Top 3
0.658 [0.511, 0.665] −0.083
0.958
0.598
DMM: Top 5
0.511 [0.489, 0.665]
0.005
0.950
0.155
DMM: Top 7
0.494 [0.375, 0.665]
0.003
0.960
0.163
Table C.3: Descriptive quality of the three Pan–Chen proxy labels. The class-weighted F1 is the
quantity displayed in Figure 2; positive-class F1 and sensitivity focus on the rare wrongdoing class.
Proxy
Weighted F1
Positive F1
Accuracy
Sensitivity
Specificity
GPT-4.1 5-shot
0.944
0.545
0.938
0.667
0.954
GPT-4 5-shot
0.942
0.511
0.939
0.577
0.960
Llama-4 0-shot
0.949
0.492
0.953
0.410
0.985
The downstream model is
logit{Pr(Yi = 1 | X∗
i , Wi)} = α + τX∗
i + γ⊤Wi,
(C.8)
where Wi contains connect2b, prevalence, regionj, groupIssue, realWorldCollectiveAction, petitioning,
sentiment_indico, and personal_experience.
Seven controls are binary and sentiment_indico is
continuous. The coefficient τ is the main estimand. The full-sample expert-label fit gives bτexpert =
−1.0388.
Proxy labels.
We use three LLM labels: GPT-4.1 5-shot, GPT-4 5-shot, and Llama-4 0-shot.
Table C.3 reports several descriptive metrics against the expert labels.
DMM and benchmark estimators.
The expert-label benchmark fits equation (C.8) using X∗
i .
Each naive estimator replaces X∗
i with one LLM label and otherwise fits the same model. DMM
estimates nuisance components using the aforementioned EM algorithm, constructs the robust bridge,
and solves equation (C.5).
The DSL benchmark uses a simple random sample of 500 expert labels, or about 35.4% of the
sample. It supplies the three LLM labels jointly, together with Wi, to the supervised prediction step.
In the implementation, dsl::dsl uses the logit downstream model and its default generalized random
forest learner with cross-fitting. Thus, DSL neither selects one proxy nor converts the three proxies
to a majority vote; it learns a joint predictor of X∗
i and then applies the design-based correction
using the sampled expert labels.
46
Fixed-target bootstrap diagnostic.
We estimate empirical coverage by asking how often each
method’s interval contains the fixed full-sample expert-label coefficient under nonparametric resam-
pling of the observed complaints.
For bootstrap draw b, we sample n = 1,412 complaints with replacement, refit the complete
estimator, and record the interval [bτb,lo, bτb,hi]. The displayed fixed-target rate is
1
500
500
X
b=1
1{bτb,lo ≤bτexpert ≤bτb,hi},
bτexpert = −1.0388.
47
