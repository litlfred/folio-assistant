---
doc_id: arxiv-2505.10399v1
doc_title: "Evaluating Model Explanations without Ground Truth"
section_id: sec-001-abstract
section_title: "Abstract"
section_number: null
pages: 1-1
source_pdf: arxiv-2505.10399v1.pdf
source_sha256: f2ddacee8dcbab71
toc_source: outline
---
There can be many competing and contradictory explanations for
a single model prediction, making it difficult to select which one
to use. Current explanation evaluation frameworks measure qual-
ity by comparing against ideal “ground-truth” explanations, or by
verifying model sensitivity to important inputs. We outline the
limitations of these approaches, and propose three desirable princi-
ples to ground the future development of explanation evaluation
strategies for local feature importance explanations. We propose
a ground-truth Agnostic eXplanation Evaluation framework
(AXE) for evaluating and comparing model explanations that satis-
fies these principles. Unlike prior approaches, AXE does not require
access to ideal ground-truth explanations for comparison, or rely
on model sensitivity – providing an independent measure of expla-
nation quality. We verify AXE by comparing with baselines, and
show how it can be used to detect explanation fairwashing. Our
code is available at https://github.com/KaiRawal/Evaluating-Model-
Explanations-without-Ground-Truth.
CCS Concepts
• Computing methodologies →Artificial intelligence; Ma-
chine learning.
Keywords
explainability, interpretability, XAI, evaluation, benchmark
ACM Reference Format:
Kaivalya Rawal, Zihao Fu, Eoin Delaney, and Chris Russell. 2025. Evaluating
Model Explanations without Ground Truth. In The 2025 ACM Conference
on Fairness, Accountability, and Transparency (FAccT ’25), June 23–26, 2025,
Athens, Greece. ACM, New York, NY, USA, 12 pages. https://doi.org/10.1145/
3715275.3732219
1
