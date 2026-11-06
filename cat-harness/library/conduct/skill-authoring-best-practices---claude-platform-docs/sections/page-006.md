---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-006
section_title: "Page 6"
pages: 6-6
pdf_page: 6
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Be specific and include key terms. Include both what the Skill does and specific triggers/contexts
for when to use it.
Each Skill has exactly one description field. The description is critical for skill selection: Claude
uses it to choose the right Skill from potentially 100+ available Skills. Your description must provide
enough detail for Claude to know when to select this Skill, while the rest of SKILL.md provides the
implementation details.
Effective examples:
PDF Processing skill:
Excel Analysis skill:
Git Commit Helper skill:
Avoid vague descriptions like these:
Progressive disclosure patterns
SKILL.md serves as an overview that points Claude to detailed materials as needed, like a table of
contents in an onboarding guide. For an explanation of how progressive disclosure works, see How
Skills work in the overview.
Practical guidance:
Keep SKILL.md body under 500 lines for optimal performance
Split content into separate files when approaching this limit
description: Extract text and tables from PDF files, fill forms, merge documents. Use w

description: Analyze Excel spreadsheets, create pivot tables, generate charts. Use when

description: Generate descriptive commit messages by analyzing git diffs. Use when the 

description: Helps with documents

description: Processes data

description: Does stuff with files

Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
6/32
