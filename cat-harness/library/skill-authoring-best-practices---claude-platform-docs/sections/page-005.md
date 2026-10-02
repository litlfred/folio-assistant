---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-005
section_title: "Page 5"
pages: 5-5
pdf_page: 5
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Skill provides.
Remember that the name field must use lowercase letters, numbers, and hyphens only.
Good naming examples (gerund form):
processing-pdfs
analyzing-spreadsheets
managing-databases
testing-code
writing-documentation
Acceptable alternatives:
Noun phrases: pdf-processing , spreadsheet-analysis
Action-oriented: process-pdfs , analyze-spreadsheets
Avoid:
Vague names: helper , utils , tools
Overly generic: documents , data , files
Reserved words: anthropic-helper , claude-tools
Inconsistent patterns within your skill collection
Consistent naming makes it easier to:
Reference Skills in documentation and conversations
Understand what a Skill does at a glance
Organize and search through multiple Skills
Maintain a professional, cohesive skill library
Writing effective descriptions
The description field enables Skill discovery and should include both what the Skill does and
when to use it.
Always write in third person. The description is injected into the system prompt, and
inconsistent point-of-view can cause discovery problems.
Good: "Processes Excel files and generates reports"
Avoid: "I can help you process Excel files"
Avoid: "You can use this to process Excel files"
Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
5/32
