---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-1
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing
Eric H. C. Chow
School of Humanities, The University of Hong Kong
eric.chow@hku.hk
Abstract
This paper presents a modular AI agentic skill pipeline for au-
tomating subject indexing with Library of Congress Subject
Headings (LCSH). Subject indexing—the process of analyzing
a work’s aboutness, selecting controlled vocabulary terms, and
encoding them as MARC 21 subject access fields—is one of the
most time-consuming components of library cataloging. The
system decomposes this process into four discrete, sequentially
executed agent skills: conceptual analysis, quantitative filtering,
authority validation, and MARC field synthesis. Each skill
encodes domain knowledge drawn directly from Library of
Congress Subject Headings Manual (SHM) instruction sheets
and subject analysis theory. The pipeline was evaluated against
a corpus of ten titles whose existing subject headings were
captured from the Harvard Library bibliographic dataset (a
snapshot of their Alma ILS). Results demonstrate strong con-
ceptual alignment with professional subject indexing practice,
with notable differences in specificity, subdivision practice, and
the agent’s adherence to the 2026 LC policy discontinuing form
subdivisions ($v) in favor of LCGFT 655 fields.
Keywords: Library of Congress Subject Headings, LCSH,
large language models, agent skills, automated subject indexing,
MARC 21, LCGFT
1
