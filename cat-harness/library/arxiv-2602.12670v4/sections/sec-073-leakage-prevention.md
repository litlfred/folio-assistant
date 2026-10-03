---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-073-leakage-prevention
section_title: "Leakage Prevention"
section_number: null
pages: 38-38
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
To prevent Skills from encoding task-specific solutions, we enforce explicit authoring guidelines
and conduct leakage audits. A Claude Code Agent SDK-based validation agent runs in CI to detect
potential Skill-solution leakage; failed tasks are rejected. Skills must not contain task-specific file-
names, paths, identifiers, constants, magic numbers, values from task specifications, exact command
sequences that solve benchmark tasks, references to specific test cases, or expected outputs.
Skills must apply to a class of tasks rather than a single instance, provide procedural guidance about
how to approach the task class rather than declarative answers about what to output, and be authored
independently of benchmark specifications. These rules are central to the paired design: if a Skill
contains the answer path for one benchmark instance, the with-Skills condition would no longer
measure reusable procedural augmentation.
M.8
