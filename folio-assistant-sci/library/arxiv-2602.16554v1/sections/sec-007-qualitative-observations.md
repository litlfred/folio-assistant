---
doc_id: arxiv-2602.16554v1
doc_title: "MERLEAN: AN AGENTIC FRAMEWORK FOR AUTOFOR- MALIZATION IN QUANTUM COMPUTATION"
section_id: sec-007-qualitative-observations
section_title: "Qualitative Observations"
section_number: null
pages: 5-6
source_pdf: 2602.16554v1.pdf
source_sha256: 765ef86c1c0d4518
toc_source: outline
---
Compile-Fix Loop Behavior.
The hard statements that require 20+ compile attempts typically
involve:
1. Dependent type arithmetic (e.g., proving i −1 + 1 = i at the type level)
2. Missing lemmas that require creative workarounds
3. Tactic timeouts requiring proof restructuring
Agent-Discovered Lemmas.
MerLean frequently introduces auxiliary lemmas not stated in the
original paper. These helper lemmas are natural intermediate steps that a human mathematician would
typically leave implicit (see Appendix A.2 for a full example). For instance, the agent introduced:
• edgeBoundary card eq edgeCount (Balanced Product Codes): Bridges the gap
between the geometric definition of expansion (boundary size) and algebraic adjacency
counts, enabling the formal derivation of the Relative Cheeger Inequality.
• pauliPair anticommuting ct satisfied (Fault-Tolerant QC): Algebraically
verifies that anticommuting spacetime faults cancel out disjointly in the detector model, a
necessary intermediate result for proving the Global Correctness of Spacetime Syndrome
Extraction.
• weight inequality core (Fault-Tolerant QC): Establishes that w′ −|S| + |∂S| ≥
min(h(G), 1)·d by case-splitting on the Cheeger parameter h(G) ≥1, bridging the cleaning
lemma and the space distance lower bound (see Appendix A.2).
Axiom Declarations.
The Balanced Product Codes formalization required explicit axiom decla-
rations where the underlying mathematical machinery is not yet available in Mathlib. Notably, the
original paper invokes these classical theorems directly without proof, as they are well-known results
in the literature; the informal proofs are therefore absent from the source material from the very
beginning, making axiomatization the natural counterpart in the formal setting. These axioms reveal
concrete gaps relevant to physics applications:
• K¨unneth Formula: The isomorphism Hn(C ⊗D) ∼= L
p+q=n Hp(C) ⊗Hq(D) for
chain complexes over F2 is not available in Mathlib (kunnethMap injective aux,
kunnethMap surjective aux).
5
• Tensor-Homology Commutativity: The isomorphism Hq(V ⊗C) ∼= V ⊗Hq(C) for a
flat module V is assumed via the combined axiom e2PageIsoHomologyTensor ax.
This conceptually bundles the vertical and horizontal homology steps to identify-
ing the spectral sequence E2 pages with tensor products of base and fiber homolo-
gies in Theorem 3. The separate axioms verticalHomologyIsoTensor ax and
horizHomologyIsoTensor ax are defined but superseded by this combined form in
the main proof.
• Spectral Sequences: The machinery for computing homology of total complexes via
spectral sequences is incomplete (spectralSequenceIsomorphism nontrivial).
This is used in Theorem 3’s proof of the Fiber Bundle K¨unneth Theorem to relate the E2
page to the total homology.
These axioms are transparently marked in both the Lean code and the generated blueprint, so that
readers immediately see which results rest on unverified assumptions. Appendix A.3 shows the full
K¨unneth formula formalization as a concrete example.
5
