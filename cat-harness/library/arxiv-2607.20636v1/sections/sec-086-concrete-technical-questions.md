---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-086-concrete-technical-questions
section_title: "Concrete Technical Questions"
section_number: null
pages: 113-113
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Improving multi-armed bandits.
For the worst-case objective, we can consider a
plethora of open problems that arise from modifying the nature of the improving reward
function (instead of diminishing returns), adding in costs to playing different arms and/or
switching between arms, and additional advice or feedback beyond bandit but less than
full information.
There are many related directions in the sequential decision-making
literature, including related to sequential Pandora’s box problems [BC24, AJS26, CCHS].
Studying the IMAB problem in beyond-worst case settings is especially exciting due to
relevance for practical problems such as hyperparameter tuning. In that vein, it is inter-
esting to consider other beyond-worst case paradigms, such as warm starting or algorithms
with predictions (which might relate to additional advice above). It is also interesting to
consider partially or fully online models for data-driven algorithm design (so far, we study
a setting where we have full offline access to past instances).
Opinion dynamics / social learning
Our work on pessimism traps provides an in-
tervention in a particular opinion dynamics model. It would be interesting to consider to
what degree this intervention is robust to exact knowledge of the strength of signal param-
eter. Further, it would be interesting to identify other models where such an intervention
breaks learning and frees agents from cascades.
8.3.2
