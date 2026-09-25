---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-043-container-environment
section_title: "Container Environment"
section_number: null
pages: 24-24
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
All tasks run in Docker containers built from an ubuntu:24.04 base image. Per-task resource
allocation is specified in the environment block of the task configuration (Appendix C):
• CPUs: 1–4 cores (task-dependent)
• Memory: 2–10 GB (task-dependent)
• Storage: 10 GB (standard across all tasks)
• GPU: None (no tasks require GPU)
Containers are deleted after each trial (delete:
true) to ensure no state leaks between runs.
D.9
