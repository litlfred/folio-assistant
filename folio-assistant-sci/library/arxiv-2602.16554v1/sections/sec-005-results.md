---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-005-results
section_title: "Results"
section_number: null
pages: 3-4
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
formula for certain coefficient rings). MerLean handles this through explicit axiom declarations,
clearly distinguishing intentional assumptions from incomplete proofs (sorry). When formalization
fails after maximum attempts, an “axiom phase” converts blocking subgoals to axioms, producing
partial formalizations with transparent assumptions that can be filled in as Mathlib expands.
3.2
AUTOINFORMALIZATION
The decoder reverses the formalization process, converting a verified Lean 4 library back into
human-readable LATEX. While existing tools such as doc-gen4 can produce reasonably readable
documentation from Lean source code, the output remains deeply tied to Lean’s type-theoretic syntax
and is difficult to interpret for readers without formal methods expertise. Therefore, MerLean utilizes
the same LLM model that performed the formalization to do the informalization: since the model
has demonstrated its ability to formalize content in the specific research area, it should also be
capable of translating each declaration into natural language, making it accessible to domain experts
with no prior knowledge of Lean. Of course, no original statement or paper content is provided
to the informalization agent to prevent data leaks. The pipeline parses all Lean files, constructs a
dependency graph, and produces two complementary outputs: an interactive blueprint compatible
with leanblueprint for web-based exploration of the dependency structure, and a standalone
textbook-style narrative for readers unfamiliar with formal methods. Any unverified assumptions
(axiom declarations) are prominently highlighted, ensuring full transparency about the boundaries
of the formalization.
3
4
