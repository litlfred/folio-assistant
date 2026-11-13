---
doc_id: equipping-agents-for-the-real-world-with-agent-skills-anthro
doc_title: "Equipping agents for the real world with Agent Skills _ Anthropic"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: Equipping agents for the real world with Agent Skills _ Anthropic.pdf
source_sha256: 521af377ed650774
text_source: embedded
granularity: page
---
This led us to create Agent Skills: organized folders of instructions, scripts, and
resources that agents can discover and load dynamically to perform better at specific
tasks. Skills extend Claude’s capabilities by packaging your expertise into composable
resources for Claude, transforming general-purpose agents into specialized agents
that fit your needs.
Building a skill for an agent is like putting together an onboarding guide for a new
hire. Instead of building fragmented, custom-designed agents for each use case,
anyone can now specialize their agents with composable capabilities by capturing
and sharing their procedural knowledge. In this article, we explain what Skills are,
show how they work, and share best practices for building your own.
A skill is a directory containing a SKILL.md file that contains organized folders of instructions,
scripts, and resources that give agents additional capabilities.
The anatomy of a skill
To see Skills in action, let’s walk through a real example: one of the skills that powers
Claude’s recently launched document editing abilities. Claude already knows a lot
about understanding PDFs, but is limited in its ability to manipulate them directly
(e.g. to fill out a form). This PDF skill lets us give Claude these new abilities.
At its simplest, a skill is a directory that contains a SKILL.md file . This file must
start with YAML frontmatter that contains some required metadata: name and
9/20/26, 4:40 PM
Equipping agents for the real world with Agent Skills \ Anthropic
https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
2/12
