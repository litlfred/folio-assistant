---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-028-task-quality-criteria
section_title: "Task Quality Criteria"
section_number: null
pages: 18-18
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Tasks are evaluated against the following criteria:
• Realistic: Grounded in professional workflows that people in that domain actually perform
• Skill-dependent: Significantly easier with Skills than without—tasks solvable without any
procedural guidance are rejected
• Verifiable: Deterministic outputs testable with programmatic assertions; LLM-as-judge is
not used
• Composable: Tasks should exercise 3–6 Skills together; instructions never reference which
Skills to use
• Test parsimony: Fewer than 10 test cases unless justified; tests should cover distinct criteria
rather than repeat similar checks
C
