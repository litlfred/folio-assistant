---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-024
section_title: "Page 24"
pages: 24-24
pdf_page: 24
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
The preceding diagram shows how executable scripts work alongside instruction files. The
instruction file (forms.md) references the script, and Claude can execute it without loading its
contents into context.
Important distinction: Make clear in your instructions whether Claude should:
Execute the script (most common): "Run analyze_form.py to extract fields"
Read it as reference (for complex logic): "See analyze_form.py for the field extraction
algorithm"
For most utility scripts, execution is preferred because it's more reliable and efficient. See the
following Runtime environment section for details on how script execution works.
Example:
Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
24/32
