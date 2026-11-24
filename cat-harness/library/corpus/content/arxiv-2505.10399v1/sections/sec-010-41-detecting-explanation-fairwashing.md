---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-010-41-detecting-explanation-fairwashing
section_title: "Detecting Explanation Fairwashing"
section_number: 4.1
pages: 7-8
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
We simulate a state-of-the-art adversarial attack [54] on explana-
tions in a real-world setting where ground-truths remain unknown.
The attack modifies a model 𝑚, known to be discriminatory, creat-
ing new models 𝑚𝑆or 𝑚𝐿that respectively fool SHAP and LIME
into generating explanations e that show the discriminatory feature
as unimportant. A good explanation evaluation metric 𝑞should
identify manipulated explanations by scoring them poorly.
This attack fairwashes model explanations by hiding discrimi-
natory model behavior. Imagine explanations for the diabetes pre-
diction model figure 1 showing that the model used benign inputs
to make its prediction, when the model actually made predictions
using protected attributes that are medically irrelevant.
Like 𝑚, 𝑚𝑆and 𝑚𝐿too make decisions using only the “pro-
tected” feature (𝑋𝜌), but they fool explainers SHAP and LIME re-
spectively into generating explanations showing spurious "foil"
features (𝑋𝜙,𝑋𝜓) as the most important [54]. We use the same
datasets and models as the original adversarial attack [54]: the Ger-
man Credit dataset from lending [27] and the COMPAS [32] dataset
and the Communities and Crime dataset [47] from criminal justice.
We then manually construct competing feature-importance ex-
planations: 𝐸𝜌is the set of all explanations where the protected
feature 𝑋𝜌is the most important feature. 𝐸𝜙and 𝐸𝜓are the ex-
planation sets where the foil feature 𝑋𝜙or 𝑋𝜓is the most impor-
tant, respectively. Finally, 𝐸𝜔is the set of all other explanations,
where the most important feature is neither protected nor a foil
feature. The credit model is adversarially modified to deliberately
favor men over others, and the criminal justice models are mod-
ified to favor white people over others. Explanations that reveal
this (𝐸𝜌) are correct. Explanations that mask this (𝐸𝜙, 𝐸𝜓) are spu-
rious. Evaluation metrics 𝑞should identify this by the condition
¯𝑞(𝐸𝜌) > ¯𝑞(𝐸𝜙) and ¯𝑞(𝐸𝜌) > ¯𝑞(𝐸𝜓); where ¯𝑞is the average quality
¯𝑞(𝐸) = Í
e∈𝐸𝑞(e)/|𝐸|.
In table 2 we summarize our results. We use AXE 𝑛=1, PGI𝑛=1
and PGU𝑛=1 to measure the quality of the 3 sets of explanations. We
fix top-n as 1 in each case because our explanations are constructed
FAccT ’25, June 23–26, 2025, Athens, Greece
Kaivalya Rawal, Zihao Fu, Eoin Delaney, and Chris Russell
Table 2: Detecting explanation fairwashing: We replicate an adversarial fairwashing attack [54] and generate spurious expla-
nations, which we try to then detect using quality metrics 𝑞that do not need ground-truths: AXE , PGI, and PGU. Complete
details are in section 4.1: 𝐸𝜌is a set of explanations that correctly denote that the most important model input feature is 𝑋𝜌. 𝐸𝜙
and 𝐸𝜓are sets of manipulated explanations created by an adversary where the most important feature is 𝑋𝜙or 𝑋𝜓.
A good evaluation metric 𝑞should distinguish manipulated explanations from correct explanations – we expect that: (i)
¯𝑞(𝐸𝜌) > ¯𝑞(𝐸𝜙) and (ii) ¯𝑞(𝐸𝜌) > ¯𝑞(𝐸𝜓); where ¯𝑞(𝐸) = Í
e∈𝐸𝑞(e)/|𝐸|. Cases where only one of the two conditions is a strict inequality
are marked with an asterisk*. AXE has a success rate of 100%, whereas the overall success rate for PGI and PGU is only 50%.
Dataset
Adversarial
Model
𝒎𝑳or 𝒎𝑺
Eval.
Metric 𝑞
(𝑛= 1)
Evaluating explanations with a single important attribute:
𝒒(𝑬𝝆) > 𝒒(𝑬𝝓)
and
𝒒(𝑬𝝆) > 𝒒(𝑬𝝍)
Protected
𝒒(𝑬𝝆)
Foil 1
𝒒(𝑬𝝓)
Foil 2
𝒒(𝑬𝝍)
Other
𝒒(𝑬𝝎)
German
Credit
𝒎𝑳
(1 foil)
PGI
0.032
0.148
na
0.018
✕
(-)PGU
-0.486
-0.536
na
-0.483
✔
AXE
1.000
0.680
na
0.617
✔
𝒎𝑺
(1 foil)
PGI
0.037
0
na
0.037
✔
(-)PGU
-0.475
-0.529
na
-0.478
✔
AXE
0.990
0.690
na
0.622
✔
COMPAS
𝒎𝑳
(1 foil)
PGI
0.006
0
na
0.067
✔
(-)PGU
-0.481
-0.479
na
-0.431
✕
AXE
0.992
0.739
na
0.534
✔
𝒎𝑺
(1 foil)
PGI
0.006
0.035
na
0.009
✕
(-)PGU
-0.091
-0.077
na
-0.090
✕
AXE
0.968
0.761
na
0.527
✔
𝒎𝑳
(2 foils)
PGI
0.006
0
0.001
0.075
✔
(-)PGU
-0.520
-0.520
0-0.524
-0.464
✕*
AXE
0.990
0.739
0.735
0.533
✔
𝒎𝑺
(2 foils)
PGI
0.005
0.039
0.041
0.010
✕
(-)PGU
-0.104
-0.090
-0.092
-0.106
✕
AXE
0.956
0.746
0.731
0.531
✔
Communities
and Crime
𝒎𝑳
(1 foil)
PGI
0.103
0
na
0.029
✔
(-)PGU
-0.479
-0.460
na
-0.481
✕
AXE
1.000
0.765
na
0.793
✔
𝒎𝑺
(1 foil)
PGI
0.089
0.006
na
0.005
✔
(-)PGU
-0.446
-0.429
na
-0.448
✕
AXE
0.985
0.765
na
0.790
✔
𝒎𝑳
(2 foils)
PGI
0.101
0.001
0.001
0.034
✔
(-)PGU
-0.534
-0.536
-0.536
-0.535
✔
AXE
0.995
0.760
0.760
0.792
✔
𝒎𝑺
(2 foils)
PGI
0.094
0.006
0.005
0.008
✔
(-)PGU
-0.479
-0.470
-0.479
-0.479
✕*
AXE
0.955
0.760
0.755
0.781
✔
to only promote one feature as important at a time. As explained,
our verification test for AXE is that AXE(𝐸𝜌) > AXE(𝐸𝜙) and
AXE(𝐸𝜌) > AXE(𝐸𝜓), which is found to always be true. Both PGI
and PGU fail their corresponding checks.
The last column of table 2 shows PGU failing to discern genuine
explanations 𝐸𝜌from spurious ones 𝐸𝜓, 𝐸𝜙7 out of 10 times, and
PGI failing to do so 3 out of 10 times. AXE never fails, placing the
overall error rate for sensitivity metrics PGI and PGU at 50%, and
for AXE at 0%. This indicates the evaluation metrics PGI and PGU
are not impartial – their optimization objectives are so aligned with
LIME and SHAP that adversarial models designed to fool LIME and
SHAP end up fooling PGI and PGU too. Table 2 proves experimen-
tally that PGI and PGU violate the on-manifold evaluation principle,
as we showed theoretically in section 2.5.
4.2
