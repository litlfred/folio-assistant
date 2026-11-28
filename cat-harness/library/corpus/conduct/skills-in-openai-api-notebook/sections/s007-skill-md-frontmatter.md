---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s007-skill-md-frontmatter
section_title: "SKILL.md frontmatter"
cells: 13-13
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
### SKILL.md frontmatter

OpenAI models expect names and descriptions to come from frontmatter (important for discovery and routing). Put name and description in the `SKILL.md` frontmatter. Use each API `create` call to upload one skill bundle (one top-level folder) containing exactly one `SKILL.md`/`skill.md`. To upload multiple skills, upload multiple bundles.
