---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-044-inference-configuration
section_title: "Inference Configuration"
section_number: null
pages: 24-24
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
• Temperature: 0 (deterministic sampling)
• Reasoning effort: Highest available setting for each model
• Context management: Sliding window with 8K token limit; oldest turns dropped when
exceeded
• Run selection: Public result files with complete metadata and healthy verifier-scored
pass/fail outcomes are preferred; timeout rows are used only as failure backfill when healthy
replacements are unavailable
D.10
