---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-002-the-skill-as-a-unit
section_title: "The skill as a unit"
section_number: null
pages: 3-4
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
A skill is a directory on the filesystem that contains a single SKILL.md file and, optionally,
supporting files such as reference documents, scripts, and templates. The SKILL.md file has two
parts: YAML frontmatter holding a name and a description, and a markdown body holding the
instructions. A minimal skill is one SKILL.md with no other files. A larger skill bundles reference
material and code alongside it [2]. In Claude Code, the reference implementation used throughout
this note, skills live in ~/.claude/skills/ for personal use, or in .claude/skills/ inside a
3
repository for project-scoped use that travels with the codebase [5].
The frontmatter has two required fields with fixed constraints. The name may be at most 64
characters, may contain only lowercase letters, numbers, and hyphens, may not contain XML
tags, and may not contain the reserved words anthropic or claude. The description must be
non-empty, at most 1024 characters, and free of XML tags [2].
4
