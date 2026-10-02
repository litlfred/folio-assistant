---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-032-controlled-metadata-vocabulary
section_title: "Controlled Metadata Vocabulary"
section_number: null
pages: 19-19
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
The metadata block is two-tier. A closed tier—category, task_type, modality, interface,
skill_type, and difficulty—draws from controlled vocabularies, of which category and
difficulty correspond to the benchmark taxonomy of Appendix M.9; an open tier (tags and
free-form Skill names) preserves authoring flexibility. The closed tier is enforced at review time
rather than at parse time: metadata is parsed as a free-form mapping with no load-time enumeration
check, so off-taxonomy values are surfaced during review rather than rejected by the parser. This
keeps authoring lightweight while still yielding the benchmark-wide classification over which the
per-domain breakdowns are computed.
C.3
