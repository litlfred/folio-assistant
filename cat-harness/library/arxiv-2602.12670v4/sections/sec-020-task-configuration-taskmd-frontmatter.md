---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-020-task-configuration-taskmd-frontmatter
section_title: "Task Configuration (task.md Frontmatter)"
section_number: null
pages: 16-16
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Each task specifies metadata and resource limits in the YAML frontmatter of task.md; the task
instruction is the document body (Appendix C):
---
schema_version : "1.3"
metadata:
author_name: Contributor
Name
author_email : email@example .com
difficulty: medium
# easy | medium | hard
category: finance -economics
tags: [pandas , data -analysis , spreadsheet ]
verifier:
type: test -script
agent: {}
environment:
network_mode : no -network
cpus: 1
# 1-4 cores
memory_mb: 4096
# 2048 -10240 MB
storage_mb: 10240
# 10 GB
standard
---
B.3
