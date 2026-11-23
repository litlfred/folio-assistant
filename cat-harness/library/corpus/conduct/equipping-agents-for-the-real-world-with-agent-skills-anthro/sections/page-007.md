---
doc_id: equipping-agents-for-the-real-world-with-agent-skills-anthro
doc_title: "Equipping agents for the real world with Agent Skills _ Anthropic"
section_id: page-007
section_title: "Page 7"
pages: 7-7
pdf_page: 7
source_pdf: Equipping agents for the real world with Agent Skills _ Anthropic.pdf
source_sha256: 521af377ed650774
text_source: embedded
granularity: page
---
overreliance on certain contexts. Pay special attention to the name and
description of your skill. Claude will use these when deciding whether to
trigger the skill in response to its current task.
Iterate with Claude: As you work on a task with Claude, ask Claude to capture its
successful approaches and common mistakes into reusable context and code
within a skill. If it goes off track when using a skill to complete a task, ask it to self-
reflect on what went wrong. This process will help you discover what context
Claude actually needs, instead of trying to anticipate it upfront.
Security considerations when using Skills
Skills provide Claude with new capabilities through instructions and code. While this
makes them powerful, it also means that malicious skills may introduce
vulnerabilities in the environment where they’re used or direct Claude to exfiltrate
data and take unintended actions.
We recommend installing skills only from trusted sources. When installing a skill
from a less-trusted source, thoroughly audit it before use. Start by reading the
contents of the files bundled in the skill to understand what it does, paying particular
attention to code dependencies and bundled resources like images or scripts.
Similarly, pay attention to instructions or code within the skill that instruct Claude to
connect to potentially untrusted external network sources.
The future of Skills
Agent Skills are supported today across Claude.ai, Claude Code, the Claude Agent
SDK, and the Claude Developer Platform.
In the coming weeks, we’ll continue to add features that support the full lifecycle of
creating, editing, discovering, sharing, and using Skills. We’re especially excited about
the opportunity for Skills to help organizations and individuals share their context
and workflows with Claude. We’ll also explore how Skills can complement Model
Context Protocol (MCP) servers by teaching agents more complex workflows that
involve external tools and software.
Looking further ahead, we hope to enable agents to create, edit, and evaluate Skills on
their own, letting them codify their own patterns of behavior into reusable
capabilities.
9/20/26, 4:40 PM
Equipping agents for the real world with Agent Skills \ Anthropic
https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
7/12
