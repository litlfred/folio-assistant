---
doc_id: agent-skills---google-antigravity-docs
doc_title: "Agent Skills - Google Antigravity Docs"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: Agent Skills - Google Antigravity Docs.pdf
source_sha256: c18bd906b75dbc75
text_source: embedded
granularity: page
---
1. Discovery: when a conversation starts, the agent sees a list of available skills with their
names and descriptions.
2. Activation: if a skill looks relevant to your task, the agent reads the full SKILL.md content.
3. Execution: the agent follows the skill’s instructions while working on your task.
You don’t need to explicitly tell the agent to use a skill—it decides based on context. However,
you can mention a skill by name if you want to ensure it’s used.
Best practices
Keep skills focused
Each skill should do one thing well. Instead of a “do everything” skill, create separate skills for
distinct tasks.
Write clear descriptions
The description is how the agent decides whether to use your skill. Make it specific about what
the skill does and when it’s useful.
Use scripts as black boxes
If your skill includes scripts, encourage the agent to run them with --help first rather than
reading the entire source code. This keeps the agent’s context focused on the task.
Include decision trees
For complex skills, add a section that helps the agent choose the right approach based on the
situation.
Skills by surface
Explore how to create and manage skills on your preferred surface:
Get Started
Features
SDK
Changelogs ↗
Blog ↗
9/20/26, 5:11 PM
Agent Skills | Google Antigravity Docs
https://antigravity.google/docs/skills/
3/4
