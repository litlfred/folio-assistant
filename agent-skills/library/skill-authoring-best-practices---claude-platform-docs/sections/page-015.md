---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-015
section_title: "Page 15"
pages: 15-15
pdf_page: 15
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
The old patterns section provides historical context without cluttering the main content.
Use consistent terminology
Choose one term and use it throughout the Skill:
Good - Consistent:
Always "API endpoint"
Always "field"
Always "extract"
Bad - Inconsistent:
Mix "API endpoint", "URL", "API route", "path"
Mix "field", "box", "element", "control"
Mix "extract", "pull", "get", "retrieve"
Consistency helps Claude parse and follow instructions.
Common patterns
Template pattern
Provide templates for output format. Match the level of strictness to your needs.
For strict requirements (such as API responses or data formats):
## Current method
Use the v2 API endpoint: `api.example.com/v2/messages`
## Old patterns
<details>
<summary>Legacy v1 API (deprecated 2025-08)</summary>
The v1 API used: `api.example.com/v1/messages`
This endpoint is no longer supported.
</details>
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
15/32
