---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-002-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
The goal of autoformalization (Szegedy, 2020) is to automatically translate mathematical statements
from natural language into formal code verifiable by systems such as Isabelle (Paulson, 1994),
Coq (Team, 2024), and Lean (Moura & Ullrich, 2021). Recent work has shown that Large Language
Models (LLMs) are well suited to this task due to their semantic processing capabilities (Wu et al.,
2022; Jiang et al., 2022; Tarrach et al., 2024; Weng et al., 2025).
While most research in autoformalization focuses on pure mathematics, applications in physics
have also attracted significant attention: Lean libraries such as PhysLean/HepLean (Tooby-Smith,
2024) and Lean-QuantumInfo (Meiburg et al., 2025) are currently under development, with the
latter specifically utilizing autoformalization tools to accelerate the process. Theoretical quantum
computation serves as an ideal testbed for this workflow. The volume of submissions to the arXiv
quant-ph category reached 11,891 articles in 2025 (arXiv, 2025), creating a verification bottleneck
that threatens to outpace the peer-review system. Functionally, the field operates as a subfield of
applied mathematics, exhibiting deep connections to linear algebra, graph theory, and algebraic
topology. The rigorous nature of these results makes them suitable for neuro-symbolic verification,
while strong industrial interest ensures practical impact.
∗Equal contribution.
1
arXiv:2602.16554v1  [cs.LO]  18 Feb 2026
In this work, we introduce MerLean, a fully automated agentic framework designed to extract,
organize, and formalize mathematical statements from LATEX source files, operating without human-in-
the-loop intervention during the formalization process. After formalization succeeds, we run a second
agent that “autoinformalizes” the verified code back into natural language, generating a blueprint for
human experts to review the semantic alignment between the formal code and the original intent. We
evaluate MerLean on three papers in theoretical quantum computing: one unpublished manuscript
(guaranteeing zero data contamination) and two previously published works. MerLean achieved
end-to-end formalization on all three papers, introducing necessary definitions and axioms where
results depend on mathematical machinery not yet available in Mathlib. An interactive example of the
formalization output is available at https://doxtor6.github.io/MerLean-examples/.
The scope of this framework extends beyond quantum computation. Any discipline that relies on
formal mathematical proofs can use this neuro-symbolic approach to scale verification and accelerate
discovery.
2
