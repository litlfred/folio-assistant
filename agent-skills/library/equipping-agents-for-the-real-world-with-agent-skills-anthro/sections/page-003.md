---
doc_id: equipping-agents-for-the-real-world-with-agent-skills-anthro
doc_title: "Equipping agents for the real world with Agent Skills _ Anthropic"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: Equipping agents for the real world with Agent Skills _ Anthropic.pdf
source_sha256: 521af377ed650774
text_source: embedded
granularity: page
---
description . At startup, the agent pre-loads the name and description of
every installed skill into its system prompt.
This metadata is the first level of progressive disclosure: it provides just enough
information for Claude to know when each skill should be used without loading all of
it into context. The actual body of this file is the second level of detail. If Claude
thinks the skill is relevant to the current task, it will load the skill by reading its full
SKILL.md into context.
A SKILL.md file must begin with YAML Frontmatter that contains a file name and description,
which is loaded into its system prompt at startup.
As skills grow in complexity, they may contain too much context to fit into a single
SKILL.md , or context that’s relevant only in specific scenarios. In these cases, skills
can bundle additional files within the skill directory and reference them by name
from SKILL.md . These additional linked files are the third level (and beyond) of
detail, which Claude can choose to navigate and discover only as needed.
In the PDF skill shown below, the SKILL.md refers to two additional files
( reference.md and forms.md ) that the skill author chooses to bundle alongside
the core SKILL.md . By moving the form-filling instructions to a separate file
( forms.md ), the skill author is able to keep the core of the skill lean, trusting that
Claude will read forms.md only when filling out a form.
9/20/26, 4:40 PM
Equipping agents for the real world with Agent Skills \ Anthropic
https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
3/12
