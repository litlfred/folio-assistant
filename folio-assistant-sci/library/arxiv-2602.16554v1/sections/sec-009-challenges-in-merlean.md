---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-009-challenges-in-merlean
section_title: "Challenges in MerLean"
section_number: null
pages: 6-6
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
Mathlib Gaps and Axiom-Based Formalization.
Our evaluation highlighted gaps in Mathlib
regarding specialized physics concepts, for instance, the K¨unneth formula was unavailable. MerLean
handles this by explicitly declaring axiom nodes in the dependency graph. More broadly, many
physics concepts are not rigorously defined in the language of mathematics (e.g., notions in quantum
field theory). Yet, it is out of the scope of this work (and similar ones) to build lean code of full prior
knowledge. Consequently, it is reasonable to develop libraries based on “axioms”. Such choices of
axioms should not be too elementary for the reason explained above, and not too advanced either,
trivializing the derivation of the main results.
Faithfulness Checking.
A critical challenge is ensuring that formalized code accurately reflects the
original text, rather than merely compiling without errors. MerLean’s faithfulness checking pipeline
is used to address this problem, while the autoinformalized blueprint exposes the logical structure for
human review. Together, these mechanisms eliminate hallucinations as much as possible, making it
immediately apparent if the agent has proven a trivial variation or fabricated a definition to satisfy the
compiler.
5.2
