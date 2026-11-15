---
doc_id: equipping-agents-for-the-real-world-with-agent-skills-anthro
doc_title: "Equipping agents for the real world with Agent Skills _ Anthropic"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: Equipping agents for the real world with Agent Skills _ Anthropic.pdf
source_sha256: 521af377ed650774
text_source: embedded
granularity: page
---
The following diagram shows how the context window changes when a skill is
triggered by a user’s message.
Skills are triggered in the context window via your system prompt.
The sequence of operations shown:
1. To start, the context window has the core system prompt and the metadata for each
of the installed skills, along with the user’s initial message;
2. Claude triggers the PDF skill by invoking a Bash tool to read the contents of
pdf/SKILL.md ;
3. Claude chooses to read the forms.md file bundled with the skill;
4. Finally, Claude proceeds with the user’s task now that it has loaded relevant
instructions from the PDF skill.
Skills and code execution
Skills can also include code for Claude to execute as tools at its discretion.
Large language models excel at many tasks, but certain operations are better suited
for traditional code execution. For example, sorting a list via token generation is far
more expensive than simply running a sorting algorithm. Beyond efficiency concerns,
many applications require the deterministic reliability that only code can provide.
9/20/26, 4:40 PM
Equipping agents for the real world with Agent Skills \ Anthropic
https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
5/12
