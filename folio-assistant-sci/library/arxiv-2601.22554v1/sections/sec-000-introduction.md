---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 2-2
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
A long-term goal of formal mathematics is to represent mathematical knowledge in a precise, machine-checked
language that supports both verification and large-scale collaboration. Proof assistants such as Lean [7, 8] have
made substantial progress toward this goal, with libraries like Mathlib [20] formalizing much of undergraduate
mathematics and an increasing body of research-level material.
As formalization projects scale, managing structure becomes as important as managing proofs.
Large
developments are typically decomposed into many interdependent definitions and theorems, spread across
multiple files and contributors. To support this process, many Lean projects adopt blueprints [16]: high-level
dependency graphs that describe what remains to be formalized and how results depend on one another.
Blueprints serve both as planning documents and as coordination tools for distributed teams.
Existing blueprint workflows, however, exhibit two fundamental limitations. First, blueprint information
is typically duplicated across an informal LATEX document and the formal Lean code. As proofs evolve,
this duplication creates significant maintenance overhead and opportunities for divergence. Second, current
tooling provides limited support for integrating AI tools, despite the fact that blueprints naturally decompose
formalization tasks into small, well-scoped units suitable for automation. These limitations have become
more pressing as AI-based theorem provers mature. While modern systems can solve many isolated problems,
real-world formalization requires reasoning about dependencies, partial progress, and natural language proofs—
precisely the information encoded in blueprints. Without a native connection between blueprints and Lean
code, deploying such systems in large projects remains limited in scope.
This paper introduces LeanArchitect, a Lean-native framework for blueprint extraction and management.
LeanArchitect allows developers to annotate Lean declarations with blueprint metadata, automatically infers
dependency and proof-status information, and generates synchronized LATEX blueprint content directly from
the Lean environment. By unifying the formal and informal views of a project, LeanArchitect reduces
duplication, improves consistency, and provides a structured interface for AI-assisted formalization.
The contributions of this paper are:
• An annotation and extraction mechanism for blueprint nodes in Lean,
• Automatic inference of dependencies and proof status in Lean,
• Integration with existing LATEX blueprint workflows,
• Empirical validation through conversion of large existing projects and a human–AI formalization case
study.
LeanArchitect does not replace the existing leanblueprint tool [16]; rather, it complements leanblueprint by
synchronizing Lean data automatically to the blueprint.
LeanArchitect is available as a Lean 4 library at https://github.com/hanwenzhu/LeanArchitect.
2
