---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-001-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-1
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Large language models (LLMs) embedded in multi-turn
agentic harnesses (Yang et al., 2024a; Wang et al., 2024b;
Xia et al., 2024; Zhang et al., 2024b) are achieving
state-of-the-art resolution rates on repository-scale coding
benchmarks (Liu et al., 2023; Jimenez et al., 2024; Zhuo
et al., 2024).
However, their per-task inference cost
exceeds that of competitive open-weight alternatives by
an order of magnitude or more, while only a minority of
1University College London, United Kingdom 2Ulsan National
Institute of Science and Technology, South Korea 3PSL Research
University, France 4University of Basel, Switzerland. Correspon-
dence to: Seongho Son <seong.son.22@ucl.ac.uk>.
The 5th Deep Learning for Code Workshop, ICML 2026.
the existing tasks truly require frontier capability. Routing
every instance to a frontier model is therefore wasteful
