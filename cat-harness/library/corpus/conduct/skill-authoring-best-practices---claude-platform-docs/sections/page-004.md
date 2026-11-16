---
doc_id: skill-authoring-best-practices---claude-platform-docs
doc_title: "Skill authoring best practices - Claude Platform Docs"
section_id: page-004
section_title: "Page 4"
pages: 4-4
pdf_page: 4
source_pdf: Skill authoring best practices - Claude Platform Docs.pdf
source_sha256: b91e7aa4b3483fca
text_source: embedded
granularity: page
---
Open field with no hazards: Many paths lead to success. Give general direction and trust
Claude to find the best route (high freedom). Example: code reviews where context
determines the best approach.
Test with all models you plan to use
Skills act as additions to models, so effectiveness depends on the underlying model. Test your Skill
with all the models you plan to use it with.
Testing considerations by model:
Claude Haiku (fast, economical): Does the Skill provide enough guidance?
Claude Sonnet (balanced): Is the Skill clear and efficient?
Claude Opus (powerful reasoning): Does the Skill avoid over-explaining?
What works perfectly for Opus might need more detail for Haiku. If you plan to use your Skill across
multiple models, aim for instructions that work well with all of them.
Skill structure
YAML Frontmatter: The SKILL.md frontmatter requires two fields:
name :
Maximum 64 characters
Must contain only lowercase letters, numbers, and hyphens
Cannot contain XML tags
Cannot contain reserved words: "anthropic", "claude"
description :
Must be non-empty
Maximum 1,024 characters
Cannot contain XML tags
Should describe what the Skill does and when to use it
For complete Skill structure details, see the Skills overview.
Naming conventions
Use consistent naming patterns to make Skills easier to reference and discuss. Consider using
gerund form (verb + -ing) for Skill names, as this clearly describes the activity or capability the
Claude Platform Docs
Cookie settings
We use cookies to deliver and improve our services,
analyze site usage, and if you agree, to customize or
personalize your experience and market our services
to you. You can read our Cookie Policy here.
9/20/26, 4:40 PM
Skill authoring best practices - Claude Platform Docs
https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
4/32
