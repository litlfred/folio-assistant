---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-001-related-work
section_title: "Related Work"
section_number: null
pages: 2-3
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
Blueprints in Lean. The term blueprint originates from Patrick Massot’s leanblueprint project [16], a
plasTEX-based system that generates dependency graphs from LATEX documents using macros such as \uses
and \leanok. Leanblueprint has been widely adopted in non-Mathlib projects due to its effectiveness in
organizing large formalization efforts (such as [2–4, 9, 13, 19]). Although leanblueprint already has a checkdecls
command for checking whether all formal declarations in the blueprint have a corresponding Lean part, there
is no support for syncing dependency and proof status information. LeanArchitect builds on this ecosystem
by providing Lean-native extraction of blueprint data, reducing manual synchronization between LATEX and
Lean.
LeanArchitect
3
LeanArchitect is also inspired by Ian Jauslin and Alex Kontorovich’s leanblueprint-extract tool,1 which is an
extension of leanblueprint that extracts raw comments from Lean to generate the LATEX blueprint. However,
leanblueprint-extract is limited in that the user has to manually write metadata such as \uses dependencies,
and the blueprint structure is restricted to follow the Lean code structure exactly.
Data extraction tools for Lean. The tool doc-gen42 generates HTML documentation directly from Lean
code. While its purpose is different, LeanArchitect’s code is inspired by doc-gen4. The tool ntp-toolkit [11]
extracts declarations and unfinished proofs from Lean, primarily for training and testing AI tools like
LeanHammer [26]. However, these systems focus on documentation or analysis rather than blueprint-driven
project management, and they do not capture informal mathematical exposition or dependency structure at
the level required for blueprint workflows.
AI-assisted theorem proving. Neural theorem provers have advanced rapidly, with capability increasing
from simple high-school problems to complex undergraduate problems [1, 5, 6, 12, 14, 15, 18, 21–25]. They are
increasingly tested on and integrated into real-world problems such as miniCTX [11] and formal-conjectures [10].
However, most setups consist largely of isolated problems and do not reflect the dependency-rich blueprint
structure of real formalization projects. Most recently, RLMEval [17] incorporates blueprint-style information
for evaluation. However, most prior work does not address the tooling required to deploy AI systems within
existing blueprint-based Lean developments. LeanArchitect fills this gap by exposing blueprint structure
directly in Lean, enabling AI systems to reason about partial progress, dependencies, and informal context
within large projects.
3
