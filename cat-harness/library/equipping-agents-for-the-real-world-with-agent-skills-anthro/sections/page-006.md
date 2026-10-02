---
doc_id: equipping-agents-for-the-real-world-with-agent-skills-anthro
doc_title: "Equipping agents for the real world with Agent Skills _ Anthropic"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: Equipping agents for the real world with Agent Skills _ Anthropic.pdf
source_sha256: 521af377ed650774
text_source: embedded
granularity: page
---
In our example, the PDF skill includes a pre-written Python script that reads a PDF
and extracts all form fields. Claude can run this script without loading either the script
or the PDF into context. And because code is deterministic, this workflow is consistent
and repeatable.
Skills can also include code for Claude to execute as tools at its discretion based on the nature
of the task.
Developing and evaluating skills
Here are some helpful guidelines for getting started with authoring and testing skills:
Start with evaluation: Identify specific gaps in your agents’ capabilities by running
them on representative tasks and observing where they struggle or require
additional context. Then build skills incrementally to address these shortcomings.
Structure for scale: When the SKILL.md file becomes unwieldy, split its content
into separate files and reference them. If certain contexts are mutually exclusive or
rarely used together, keeping the paths separate will reduce the token usage.
Finally, code can serve as both executable tools and as documentation. It should be
clear whether Claude should run scripts directly or read them into context as
reference.
Think from Claude’s perspective: Monitor how Claude uses your skill in real
scenarios and iterate based on observations: watch for unexpected trajectories or
9/20/26, 4:40 PM
Equipping agents for the real world with Agent Skills \ Anthropic
https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
6/12
