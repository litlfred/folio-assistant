---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-003-overview
section_title: "Overview"
section_number: null
pages: 3-3
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
LeanArchitect is a tool for extracting blueprint information directly from Lean code. Its core design principle is
to minimize duplication between LATEX and Lean, by treating Lean as the authoritative source of information
for any formalized blueprint node.
The system introduces a new attribute, @[blueprint], which can be attached to Lean definitions and theorems.
This attribute records metadata such as a LATEX label, natural language statements and proofs, and project-
management annotations. In addition, LeanArchitect automatically infers metadata such as:
• Dependencies between definitions and theorems,
• Formalization status of the theorems (i.e., if they are sorry-free).
