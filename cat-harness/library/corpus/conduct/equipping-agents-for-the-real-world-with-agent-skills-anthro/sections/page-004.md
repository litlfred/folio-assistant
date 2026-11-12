---
doc_id: equipping-agents-for-the-real-world-with-agent-skills-anthro
doc_title: "Equipping agents for the real world with Agent Skills _ Anthropic"
section_id: page-004
section_title: "Page 4"
pages: 4-4
pdf_page: 4
source_pdf: Equipping agents for the real world with Agent Skills _ Anthropic.pdf
source_sha256: 521af377ed650774
text_source: embedded
granularity: page
---
You can incorporate more context (via additional files) into your skill that can then be triggered
by Claude based on the system prompt.
Progressive disclosure is the core design principle that makes Agent Skills flexible
and scalable. Like a well-organized manual that starts with a table of contents, then
specific chapters, and finally a detailed appendix, skills let Claude load information
only as needed:
Agents with a filesystem and code execution tools don’t need to read the entirety of a
skill into their context window when working on a particular task. This means that the
amount of context that can be bundled into a skill is effectively unbounded.
Skills and the context window
9/20/26, 4:40 PM
Equipping agents for the real world with Agent Skills \ Anthropic
https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
4/12
