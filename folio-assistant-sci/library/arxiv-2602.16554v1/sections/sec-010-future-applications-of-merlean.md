---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-010-future-applications-of-merlean
section_title: "Future Applications of MerLean"
section_number: null
pages: 6-7
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
Research Assistant.
During our initial formalization of the unpublished Quantum Topology paper,
one lemma persistently required an axiom. Examining the autoinformalized blueprint revealed that an
ambiguous definition, where a constraint the author had implicitly assumed was lacking, caused the
problem. After fixing the LATEX source, MerLean produced a complete formalization. This illustrates
how the bidirectional pipeline can help researchers improve the rigor of their setups, definitions, and
proofs.
Formalized Peer Review.
Our validation on an unpublished manuscript confirms that MerLean
operates without pre-training on the specific content. We envision a workflow where autoformalization
occurs locally during drafting. Just as LATEX became the standard for mathematical typesetting, agentic
frameworks could make formal repositories a standard companion to static PDFs, transforming peer
review dynamics: reviewers could rely on machine-verified guarantees, focusing strictly on novelty
and scientific significance.
Synthetic Data Flywheel.
Autoformalization also plays a critical role in training specialized
theorem provers, as the quality of large-scale synthetic data depends directly on accurate formal-
ization (Xin et al., 2024; Kumarappan et al., 2025). MerLean facilitates a virtuous cycle for LLM
training by mining high-quality (natural language, formal code) pairs grounded in the scientific
research they are based on. Feeding it back into base models will improve the next generation of
agents.
6
Contributing to Physics Libraries.
The Lean ecosystem has seen growing efforts to formal-
ize physics, including PhysLean/HepLean (Tooby-Smith, 2024) for general physics and Lean-
QuantumInfo (Meiburg et al., 2025) for quantum information theory. MerLean can accelerate
contributions to these libraries by formalizing relevant research papers and extracting reusable defini-
tions and lemmas. Alternatively, researchers can use MerLean to create domain-specific libraries by
formalizing a collection of strongly related papers, building a coherent formal foundation for their
research area that captures the interconnected definitions, lemmas, and theorems spanning multiple
works.
6
