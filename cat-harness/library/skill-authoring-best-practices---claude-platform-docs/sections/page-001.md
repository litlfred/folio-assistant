---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Messages Skills
Skill authoring best practices
Learn how to write effective Skills that Claude can discover and use successfully.
Good Skills are concise, well-structured, and tested with real usage. This guide provides practical
authoring decisions to help you write Skills that Claude can discover and use effectively.
For conceptual background on how Skills work, see the Skills overview.
Core principles
Concise is key
The context window is a public good. Your Skill shares the context window with everything else
Claude needs to know, including:
The system prompt
Conversation history
Other Skills' metadata
Your actual request
Not every token in your Skill has an immediate cost. At startup, only the metadata (name and
description) from all Skills is pre-loaded. Claude reads SKILL.md only when the Skill becomes
relevant, and reads additional files only as needed. However, being concise in SKILL.md still
matters: once Claude loads it, every token competes with conversation history and other context.
Default assumption: Claude is already very smart
Only add context Claude doesn't already have. Challenge each piece of information:
"Does Claude really need this explanation?"
"Can I assume Claude knows this?"
"Does this paragraph justify its token cost?"
Good example: Concise (approximately 50 tokens):
Copy page

Claude Platform Docs


Ask Docs 
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
Customize Cookie Settings
Reject All Cookies
Accept All Cookies
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
1/32
