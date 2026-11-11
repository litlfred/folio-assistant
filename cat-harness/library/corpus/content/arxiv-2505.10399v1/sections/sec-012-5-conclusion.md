---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-012-5-conclusion
section_title: "Conclusion"
section_number: 5
pages: 10-11
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
The ability to measure explanation quality is integral to developing
better explanations, and to engender trust in existing XAI methods.
In section 2.2 we introduced three principles to guide the evalua-
tion of explainers and local feature-importance model explanations:
local contextualization, model relativism, and on-manifold
evaluation, reflecting that explanations should be dependent on
input datapoints, dependent on models, and independent of off-
manifold behavior respectively. We constructed simple examples in
sections 2.4 and 2.5 showcasing the violations of these principles
by prior evaluation frameworks, and uncovering the absurdities of
existing XAI evaluation frameworks – such as comparing a single
global explanation with local model explanations of different in-
put datapoints. To operationalize the finding from human-centered
user research that useful explanations are those that help users
predict model behavior [12], in section 3.1 we proposed AXE : a
new ground-truth Agnostic eXplanation Evaluation framework,
and in 3.2 we used a simple example to showcase AXE in action
and motivate the underlying design choice of k-NN. Finally, in
section 4.1 we showed empirically how AXE can be used to detect
fairwashing of explanations – to our knowledge the first evaluation
metric to be able to do this perfectly, and in section 4.2 we compared
AXE with prior baselines to show through computations that AXE
satisfies all three desirable principles of explanation evaluation.
This work has several implications for AI trustworthiness, fair-
ness, and transparency. The lack of good selection processes to
choose between explanations undermines trust not just in individ-
ual explanations and models, but in the field at large. It hinders
practitioners from adopting XAI, and leads to unresolved problems
about explanation disagreement in machine learning. We hope
the principles introduced in this paper and the AXE evaluation
framework can help build a robust and stable foundation for local
explanations in XAI.
Evaluating Model Explanations without Ground Truth
FAccT ’25, June 23–26, 2025, Athens, Greece
