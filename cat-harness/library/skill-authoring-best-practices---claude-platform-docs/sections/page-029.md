---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-029
section_title: "Page 29"
pages: 29-29
pdf_page: 29
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Technical notes
YAML frontmatter requirements
The SKILL.md frontmatter requires name and description fields with specific validation rules:
name : Maximum 64 characters, lowercase letters/numbers/hyphens only, no XML tags, no
reserved words
description : Maximum 1,024 characters, non-empty, no XML tags
See the Skills overview for complete structure details.
Token budgets
Keep SKILL.md body under 500 lines for optimal performance. If your content exceeds this, split it
into separate files using the progressive disclosure patterns described earlier. For architectural
details, see the Skills overview.
Checklist for effective Skills
Before sharing a Skill, verify:
Core quality
Description is specific and includes key terms
Description includes both what the Skill does and when to use it
SKILL.md body is under 500 lines
Additional details are in separate files (if needed)
No time-sensitive information (or in "old patterns" section)
Consistent terminology throughout
Examples are concrete, not abstract
File references are one level deep
Progressive disclosure used appropriately
Workflows have clear steps
Code and scripts
Scripts solve problems rather than defer to Claude
Error handling is explicit and helpful
No "voodoo constants" (all values justified)
Required packages listed in instructions and verified as available
Scripts have clear documentation
Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
29/32
