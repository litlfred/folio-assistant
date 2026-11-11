---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s002-what-is-a-skill
section_title: "What is a skill?"
cells: 1-2
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
## What is a skill?

A skill is a reusable bundle of files (instructions + scripts + assets), packaged as a folder and anchored by a required `SKILL.md` manifest. OpenAI copies that bundle into an execution environment so the model can read instructions and run code as needed.

In hosted shell, here's what happens when you attach skills to the shell tool environment (`environment.type="container_auto"`):


- The service uploads and unzips skills into the runtime
- The service reads `SKILL.md` frontmatter (name/description), then adds each skill’s `name`, `description`, and `path` to user prompt context, which lets the model know the skill exists
- If the model decides to invoke a skill, it uses the `path` to read `SKILL.md`, then explores files and executes scripts via the shell tool

Skill instructions have the same priority as other user-provided instructions.

Skills are for procedures: repeatable workflows where the _how_ matters (steps, branching logic, formatting rules, scripts). Skills are useful for when you want your procedure:

- Reused across prompts/agents
- Versioned and independently shipped
- Invoked only when needed (not baked into every system prompt)
