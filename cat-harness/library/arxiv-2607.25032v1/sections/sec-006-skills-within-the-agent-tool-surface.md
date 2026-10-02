---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-006-skills-within-the-agent-tool-surface
section_title: "Skills within the agent tool surface"
section_number: null
pages: 5-6
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
Skills are one of several mechanisms that change how an agent behaves. They are easy to confuse,
and choosing the wrong one is a common source of unreliable behaviour. Two questions separate
them: who decides that the mechanism runs, and what guarantee it provides. Table 1 sets
out the mechanisms against these two questions, as Claude Code implements them. Analogous
5
mechanisms exist in other tools: the external tool connection follows the cross-vendor Model
Context Protocol (MCP), and the project memory file has a cross-tool analogue in the AGENTS.md
convention.
Mechanism
Who decides it runs
What it provides
Reach for it when
Memory file (CLAUDE.md)
The runtime, always
Standing project
context, present every
turn
The instruction is
short, general, and
should stay in view at
all times
Skill
The model, by
matching the
description; or the user,
by name
Procedural knowledge
and bundled resources,
loaded in stages
The task needs domain
procedure or reference
material the model
should find on its own
Slash command
The user, by typing
/name
A saved prompt run on
demand
You want to decide
exactly when a prompt
runs
Subagent
The model or the user,
by delegating
A separate instance
with its own context
window and tools
Work should run in
isolation to keep the
main context focused
External tool (MCP)
The model, by calling
the tool
A connection to an
external service or data
source
The model must act in
the outside world, on a
repository, a database,
or a chat system
Hook
The runtime, on a
lifecycle event
Deterministic
execution that can
block an action
A step must happen
every time, or an
action must be
prevented
Plugin
Installed by the user
A bundle of the above
for distribution
You are packaging
capabilities to share
across a team
Table 1: The mechanisms that shape agent behaviour, separated by who decides that each runs and what
it guarantees.
Overlap between commands and skills.
In current Claude Code, slash commands and
skills have converged: both can be invoked as /name, and files in .claude/commands/ continue to
work [5]. The practical reading is that a slash command and a skill sit on one continuum. The
command end is a single prompt file triggered by name. The skill end adds automatic invocation
by description, staged loading, and bundled files. Choose the command end to decide when it
runs, and the skill end to let the model recognise the moment or to carry supporting files and
scripts.
Figure 4 places the mechanisms on two axes: who decides the run, the model, the user, or the
runtime, and how strong the effect is, from advisory to blocking. The two tend to track together,
because only runtime-decided mechanisms can be made deterministic. A skill sits in the advisory,
model-decided region, and a hook in the blocking, runtime-guaranteed region. A memory file is
the exception, always loaded yet advisory. The positions are indicative rather than precise, but
they show the gap that matters in practice.
8
