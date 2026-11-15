---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-002-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-2
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
As artificial intelligence (AI) systems are increasingly used in critical
decision-making processes, knowing which model explanation to
trust has emerged as a fundamental challenge. Model explanations
often disagree with each other (see figure 1), and the selection
This work is licensed under a Creative Commons Attribution 4.0 International License.
FAccT ’25, Athens, Greece
© 2025 Copyright held by the owner/author(s).
ACM ISBN 979-8-4007-1482-5/2025/06
https://doi.org/10.1145/3715275.3732219
of incorrect or intentionally misleading explanations can have far-
reaching consequences – from misinforming users and regulators to
reinforcing systemic biases and eroding public trust in AI systems [5,
37, 39]. This challenge is particularly acute in high-stakes domains
like healthcare diagnostics, financial and credit scoring services, and
criminal justice, where machine learning models directly impact
human lives. It is essential to be able to select the best explanation
from a set of possible explanations, but unfortunately there has
been little progress towards this critical problem.
User studies offer a workaround – of approximately 300 pa-
pers proposing new model explanation methods (explainers), one
in seven performed user study evaluations [42]. However, one in
three papers evaluated entirely anecdotally, reflecting the need for
standardized evaluation frameworks [42]. Without consensus on
the essential properties that explanations should possess and robust
frameworks to numerically evaluate them, progress in the field re-
mains slow and fragmented. Historically, advances in AI have often
been driven by benchmark datasets and deterministic evaluation
frameworks defined using standard metrics – as exemplified by
ImageNet for computer vision [15] and MMLU for language under-
standing [26]. Developing analogous benchmarks for eXplainable
AI (XAI) involves unique challenges, including a lack of access to
reliable “ground-truth” explanations to compare against. This ham-
pers our ability to meaningfully evaluate competing explanation
methods, assess their utility to users impacted by AI systems, or
their faithfulness to model behavior. Progress towards these goals
can ensure that XAI truly makes AI systems transparent.
There are many forms of model explanation. One popular cat-
egory among practitioners is post-hoc model-agnostic feature-
importance explanations, such as LIME [48] or SHAP [36]. These
provide explanations for individual predictions rather than describ-
ing global model behavior. They can operate on any model type,
including neural networks, regardless of weights or architecture.
They produce feature importances as output: a signed vector indi-
cating the relative contribution of each input feature to the output.
While there are many competing explanation types, data modali-
ties, and evaluation desiderata, [33], this paper focuses exclusively
on local feature-importance explanations for models operating on
tabular datasets. Even in this restricted setting, different explana-
tion methods (explainers) often provide contradictory explanations
(figure 1). In this paper we do not propose a new XAI method but in-
stead develop three general principles: local contextualization, model
relativism, and on-manifold evaluation to guide the evaluation of
feature-importance explanations. We use these to propose AXE, a
FAccT ’25, June 23–26, 2025, Athens, Greece
Kaivalya Rawal, Zihao Fu, Eoin Delaney, and Chris Russell
 Signed Feature Importance Percentages
0
20
40
60
80
100
Diabetes Pedigree
Function = 0.338
BMI = 31.3
Pregnancies = 4.0
←
→
Diabetic  Non-diabetic
(a) “Gradients” explainer: Diabetes Pedigree Function is the most important
input feature, pushing the classifier to a positive prediction (diabetic)
 Signed Feature Importance Percentages
−20
0
20
40
60
80
100
Diabetes Pedigree
Function = 0.338
BMI = 31.3
Glucose = 154.0
Age = 37.0
←
→
Diabetic  Non-diabetic
(b) “SHAP” explainer: Glucose is still the most important (positive) input,
BMI now has an negative importance (non-diabetic)
 Signed Feature Importance Percentages
−20
0
20
40
60
80
Insulin = 126.0
Blood
Pressure = 72.0
Glucose = 154.0
BMI = 31.3
Age = 37.0
←
→
Diabetic 
 Non-diabetic
(c) “LIME” explainer: Glucose (positive), BMI (positive), and Insulin
(negative) are all important input features
 Signed Feature Importance Percentages
−20
−10
0
10
20
30
40
50
60
70
80
90
Blood
Pressure = 72.0
Glucose = 154.0
BMI = 31.3
Age = 37.0
←
→
Diabetic 
 Non-diabetic
(d) “Integrated Gradients” explainer: Glucose (positive) BMI (positive) and Blood
Pressure (negative) are important.
Figure 1: Different Explainers Yield Different Explanations: A neural network predicts diabetes on the “Pima Indians” dataset
[10]. A single positive (diabetic) prediction is explained using four explainers. These feature-importance explanations, visualized
here as “force-plots”, consist of a signed vector indicating the relative contribution of each input to the model output. They
disagree with each other. Section 2.3 details the explainers, and section 3.1 evaluates these four explanations using AXE.
new ground-truth Agnostic eXplanation Evaluation framework
that considers a good explanation to be one that correctly identifies
the features most predictive of model outputs. AXE is inspired by
user research which indicates useful explanations are those that
help users emulate and predict model behavior [12].
The plots in figure 1 visualize competing explanations for the
same datapoint in a diabetes classification model. They disagree
with each other in the contributions of the input features, a phe-
nomenon commonly documented in the literature [5, 31, 39]. Some
XAI methods such as LIME and SHAP often rely on off-manifold
model predictions to generate a single explanation, leading to dif-
ferent explanations. This explicit reliance on feature sensitivity is
one potential cause for explanation disagreement, which we seek to
address through the on-manifold evaluation principle proposed in
section 2.2 A good explanation evaluation framework should pro-
vide clear guidance about which explanation is better, helping users
make sense of competing explainers. Explanation disagreement can
be exploited by adversaries to produce fairwashed explanations
– where a given explainer certifies that protected attributes were
not important to the model even if they determined the prediction
[3, 54]. This presents a risk for auditors and regulators enforcing
AI fairness, further motivating our work and highlighting the im-
portance of evaluating explanation quality.
This paper is structured as follows: in section 2 we define our
notation, introduce three foundational principles for explanation
evaluation, and describe prior work. In section 3 we introduce AXE,
an explanation evaluation framework directly couched in terms of
predictive accuracy – the notion that a good human-interpretable
explanation is one which identifies the features most predictive
of the model behavior [11, 12]. In section 4, we demonstrate how
AXE can be used to detect explanation fairwashing – foiling a state-
of-the-art adversarial attack [54], and compare AXE with existing
baselines from the literature. We conclude in section 5 with a brief
summary discussion.
2
Evaluating Model Explanations
A typical scenario depicting the generation and evaluation of local,
post-hoc, model-agnostic explanations is presented in figure 2.
x
input vector
model
+
explanation vector
(signed importances)
 ε
explainer
m
e
(a) Explanation generation: Explainer E produces an explanation vector e of
signed feature importances using datapoint x, model 𝑚and prediction 𝑚(x)
m(x)
model prediction
?
AXE prediction
M  (x,e)
c
(b) Explanation evaluation: AXE evaluates the quality 𝑞of explanation e by
measuring how accurately prediction 𝑚(x) can be recovered from dataset X.
Figure 2: Explanation Generation (a) and Evaluation (b): AXE
measures how well a given explanation can help emulate
model behavior. See section 3.1 for full algorithm.
2.1
