---
doc_id: arxiv-2602.12670v4
doc_title: "SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks"
section_id: sec-039-skill-structure
section_title: "Skill Structure"
section_number: null
pages: 21-21
source_pdf: 2602.12670v4.pdf
source_sha256: e987ebc3f0084a1f
toc_source: outline
---
Each Skill is a directory containing a required SKILL.md file with YAML frontmatter and optional
bundled resources:
skill -name/
SKILL.md
# Required: YAML
frontmatter + instructions
scripts/
# Optional: executable
code
references/
# Optional: reference
documentation
The SKILL.md frontmatter specifies the Skill’s name and a one-line description used by agents for
skill discovery. The body contains procedural guidance, code examples, and usage patterns.
D.6
