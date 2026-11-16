---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-007-project-management-using-leanarchitect
section_title: "Project Management Using LeanArchitect"
section_number: null
pages: 5-5
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
We envision the workflow of a large Lean project using LeanArchitect to be as follows.
1. Mathematicians write a detailed exposition of the formalization target in a LATEX document (e.g. on
Overleaf), following some source material.
2. A new formalization project is set up (e.g. on GitHub) with the document as a blueprint.
3. Lean experts translate each theorem or definition into Lean, tagging each one with @[blueprint]. This
translation can leave sorry placeholders in the code.
4. In the LATEX blueprint, managers can then use \inputleannode to replace existing theorems with
automatically inferred blueprint metadata.
5. Lean experts fill the sorrys in the code, while LeanArchitect automatically updates the metadata.
We also provide blueprintConvert, a script that replaces a theorem or definition in the LATEX blueprint with
\inputleannode, and inserts an appropriate @[blueprint] tag into the Lean code. This script is primarily used
to automatically migrate existing leanblueprint-based projects to LeanArchitect format (see section 4.2), but
it can also automate steps 3–4 above.
4
