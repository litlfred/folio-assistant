---
doc_id: agent-skill-best-practices---gemini-cli
doc_title: "Agent Skill best practices - Gemini CLI"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: Agent Skill best practices - Gemini CLI.pdf
source_sha256: 5e69cc80f81e07b8
text_source: embedded
granularity: page
---
Agent Skill best practices
Create high-quality, reliable Agent Skills by following these established design principles and
patterns.
Design for discovery
The most important part of a skill is its description. This is the only information the model has
before activation.
Be specific: Use keywords that are likely to appear in user prompts (for example, “audit,”
“security,” “refactor,” “migration”).
Define the trigger: Clearly state when the skill should be used (for example, “Use this skill
when the user asks to review a PR for performance regressions”).
Avoid overlap: Ensure your skill descriptions are distinct from one another and from the
general capabilities of the model.
Progressive disclosure
The “context window” is a shared resource. Use a three-level loading system to manage context
efficiently.
1. Metadata (name + description): Always in context (~100 words).
2. SKILL.md body: Loaded only after the skill triggers (<5k words).
3. Bundled resources: Loaded only as needed by the model.
Unpaid tier and Google One users: Gemini CLI was replaced by Antigravity CLI on June 18th, 2026. To learn
more, see our blog post.
Gemini CLI
Home
Plans
Extensions
Docs
Reference
Resources
This website uses cookies from Google to deliver and enhance the quality of its services and
to analyze traffic.
I understand.
9/20/26, 4:44 PM
Agent Skill best practices | Gemini CLI
https://geminicli.com/docs/cli/skills-best-practices/
1/3
