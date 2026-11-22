---
doc_id: agent-skill-best-practices---gemini-cli
doc_title: "Agent Skill best practices - Gemini CLI"
section_id: page-002
section_title: "Page 2"
pages: 2-2
pdf_page: 2
source_pdf: Agent Skill best practices - Gemini CLI.pdf
source_sha256: 5e69cc80f81e07b8
text_source: embedded
granularity: page
---
Best practice: Keep the SKILL.md body focused on core procedural instructions. Move detailed
reference material, schemas, and examples into separate files in a references/ directory.
Degrees of freedom
Match the level of instruction specificity to the task’s fragility.
High freedom (text-based instructions): Use when multiple approaches are valid or
decisions depend heavily on context.
Medium freedom (pseudocode or scripts with parameters): Use when a preferred pattern
exists but some variation is acceptable.
Low freedom (specific scripts, few parameters): Use when operations are fragile and
error-prone, or a specific sequence MUST be followed.
Bundle resources effectively
Leverage the skill’s ability to include scripts and assets to extend the agent’s capabilities.
Use scripts for deterministic tasks: If a task can be automated with a script (for example,
running a linter, fetching data from an API), bundle it in the scripts/ folder.
Agentic ergonomics: Ensure scripts output LLM-friendly stdout. Suppress verbose
tracebacks and provide clear, concise success/failure messages.
Provide templates: Include common file headers or boilerplate code in the assets/ folder
to ensure the agent produces consistent output.
Anatomy of a great skill
A well-structured skill directory organizes its resources into specialized sub-folders.
my-skill/
├── SKILL.md       (Required) Core instructions and metadata
├── scripts/       (Optional) Executable logic (Node.js, Python, etc.)
├── references/    (Optional) Documentation to be loaded as needed
└── assets/        (Optional) Templates and non-executable resources
This website uses cookies from Google to deliver and enhance the quality of its services and
to analyze traffic.
9/20/26, 4:44 PM
Agent Skill best practices | Gemini CLI
https://geminicli.com/docs/cli/skills-best-practices/
2/3
