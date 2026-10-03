---
doc_id: agent-skills---google-antigravity-docs
doc_title: "Agent Skills - Google Antigravity Docs"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: Agent Skills - Google Antigravity Docs.pdf
source_sha256: c18bd906b75dbc75
text_source: embedded
granularity: page
---
Manifest format (SKILL.md)
Every SKILL.md file begins with YAML frontmatter defining its name and triggering criteria:
Frontmatter fields
The YAML frontmatter supports the following fields:
Field
Required
Description
name
No
A unique identifier for the skill (lowercase, hyphens for spaces). Defaults to
the folder name if not provided.
description
Yes
A clear description of what the skill does and when to use it. This is what the
agent sees when deciding whether to apply the skill.
Tip
Write your description in third person and include keywords that help the agent recognize when the
skill is relevant. For example: “Generates unit tests for Python code using pytest conventions.”
How the agent uses skills
Skills follow a progressive disclosure pattern:
---
name: code-review
description: Reviews code changes for bugs, style issues, and best 
practices. Use when reviewing pull requests or checking code quality.
---
# Code Review Skill
When reviewing code, follow these steps:
## Review checklist
1. **Correctness**: verify that the code satisfies specifications.
2. **Edge cases**: ensure error conditions and boundaries are handled.
3. **Style**: follow project naming and architectural patterns.
4. **Performance**: identify potential bottlenecks or inefficiencies.
content_copy
Get Started
Features
SDK
Changelogs ↗
Blog ↗
9/20/26, 5:11 PM
Agent Skills | Google Antigravity Docs
https://antigravity.google/docs/skills/
2/4
