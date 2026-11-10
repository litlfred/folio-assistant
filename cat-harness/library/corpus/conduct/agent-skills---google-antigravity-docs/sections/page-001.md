---
doc_id: agent-skills---google-antigravity-docs
doc_title: "Agent Skills - Google Antigravity Docs"
section_id: page-001
section_title: "Page 1"
pages: 1-1
pdf_page: 1
source_pdf: Agent Skills - Google Antigravity Docs.pdf
source_sha256: c18bd906b75dbc75
text_source: embedded
granularity: page
---
Features
Extend
Skills
Agent Skills
AVAILABLE ON:
Antigravity 2.0
Antigravity CLI
Antigravity IDE
Agent skills
Skills are an open standard for extending agent capabilities. A skill is a folder containing a
SKILL.md file with instructions that the agent can follow when working on specific tasks.
What are skills?
Skills are reusable packages of knowledge that extend what the agent can do. Each skill
contains:
Instructions: explicit protocols for how to approach a specific task.
Best practices: conventions, style guidelines, and checklists to follow.
Scripts and resources: optional helper scripts and data schemas the agent can execute.
When you start a conversation, the agent sees a list of available skills with their names and
descriptions. If a skill looks relevant to your task, the agent reads the full instructions and follows
them.
Note
Note: Antigravity defaults to .agents/skills, but still maintains backward compatibility for
.agent/skills.
Anatomy of a skill
Skills are organized as directory bundles containing a required SKILL.md file:
Markdown keyboard_arrow_down
my-skill/
├── SKILL.md       # Required skill instructions and metadata
├── scripts/       # Optional executable scripts
├── examples/      # Optional reference implementations
└── resources/     # Optional templates, schemas, or data files
content_copy
Get Started
Features
SDK
Changelogs ↗
Blog ↗
9/20/26, 5:11 PM
Agent Skills | Google Antigravity Docs
https://antigravity.google/docs/skills/
1/4
