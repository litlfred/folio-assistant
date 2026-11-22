---
doc_id: arxiv-2601.22554v1
doc_title: "LeanArchitect LeanArchitect"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-2
source_pdf: 2601.22554v1.pdf
source_sha256: d5f16d2420823218
toc_source: outline
---
LeanArchitect
1
LeanArchitect
Automating Blueprint Generation for Humans and AI
Thomas Zhu1
Pietro Monticone2
Jeremy Avigad1
Sean Welleck1
1Carnegie Mellon University
2University of Trento
Abstract
Large-scale formalization projects in Lean rely on blueprints: structured dependency graphs linking informal
mathematical exposition to formal declarations. While blueprints are central to human collaboration, existing
tooling treats the informal (LATEX) and formal (Lean) components as largely decoupled artifacts, leading
to maintenance overhead and limiting integration with AI automation. We present LeanArchitect, a Lean
package for extracting, managing, and exporting blueprint data directly from Lean code.
LeanArchitect
introduces a declarative annotation mechanism that associates formal declarations with blueprint metadata,
automatically infers dependency information, and generates LATEX blueprint content synchronized with the
Lean development. This design eliminates duplication between formal and informal representations and eases
fine-grained progress tracking for both human contributors and AI-based theorem provers. We demonstrate
the practicality of LeanArchitect through the automated conversion of several large existing blueprint-driven
projects, and through a human–AI collaboration case study formalizing a multivariate Taylor theorem. Our
results show that LeanArchitect improves maintainability, exposes latent inconsistencies in existing blueprints,
and provides an effective interface for integrating AI tools into real-world formalization workflows.
arXiv:2601.22554v1  [cs.LO]  30 Jan 2026
LeanArchitect
2
1
