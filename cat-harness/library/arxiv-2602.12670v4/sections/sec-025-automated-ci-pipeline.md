---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-025-automated-ci-pipeline
section_title: "Automated CI Pipeline"
section_number: null
pages: 17-17
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
The CI pipeline performs the following checks on each PR:
• Structural validation (bench tasks check): Verifies required files exist, the task.md
frontmatter schema is valid, Dockerfile builds, and test structure is correct.
• Oracle execution (bench eval create –agent oracle): Runs the oracle solution end-
to-end and requires 100% test pass rate.
• AI-detection screening: Runs GPTZero on the task.md instruction body to flag potential
model-generated content.
• LLM-backed quality checks: Automated verification of behavior consistency between
instructions and tests, anti-cheating measures, pinned dependency checks, typo detection,
and hardcoded solution detection.
B.8
