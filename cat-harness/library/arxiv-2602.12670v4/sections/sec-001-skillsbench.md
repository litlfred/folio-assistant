---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-001-skillsbench
section_title: "SkillsBench"
section_number: null
pages: 2-2
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Our contribution is two-tier:
• Narrow contribution: a quantitative answer to “how much do Skills help?” On the 87-task
benchmark, evaluated under matched no-Skills and curated-Skills conditions across 18 model–
harness configurations, curated Skills lift task-macro pass rate from 33.9% to 50.5% (+16.6 pp;
25.5% normalized gain), with substantial configuration-level heterogeneity (+4.1 to +25.7 pp).
• Broad contribution: a paired-evaluation framework for agent augmentation, generalizable
beyond Skills. The same paired (with vs. without) protocol, contributor-driven sourcing, leakage-
controlled task-to-artifact decoupling, and BenchFlow [BenchFlow team, 2026] containerized
harness can evaluate other artifacts (retrieval pipelines, memory stores, scaffolding) without
confounding model and augmentation effects. We open-source the benchmark, harness, and public
trajectories/results so practitioners can test their own Skill libraries before shipping.
2
