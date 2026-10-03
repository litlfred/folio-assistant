---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-019-task-directory-structure
section_title: "Task Directory Structure"
section_number: null
pages: 15-16
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Each task is a self-contained directory with the following layout:
tasks/<task -id >/
task.md
# YAML
frontmatter + task
instruction
environment/
15
Dockerfile
# Container
setup
skills/
# Curated
Skills (absent in no -Skills)
<skill -name >/
SKILL.md
# Required
per
skill
scripts/
# Optional
executable
code
references/
# Optional
reference
documentation
oracle/
solve.sh
# Oracle
solution (must
pass
100%)
verifier/
test.sh
# Runs
pytest
inside
the
container
test_outputs .py
# Programmatic
assertions
B.2
