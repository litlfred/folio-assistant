---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s004-skills-vs-tools-vs-system-prompts
section_title: "Skills vs. tools vs. system prompts"
cells: 7-10
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
## Skills vs. tools vs. system prompts

System prompts and tool schemas become heavy when the boundary isn’t crisp. Use all three to stay organized and help models perform better. Here’s a simple framework:

**System prompt: global behavior and constraints**

Use for:
- Safety boundaries, tone, refusal style
- “Always do X” principles that apply every turn
- Small, stable policies

Avoid:

- Putting long, multi-step procedures here (it bloats every turn and becomes brittle)

**Tools: “do something in the world”**

Use tools when the model must:

- Call external services or databases
- Create side effects (tasks outside of the environment, like canceling an order or sending an email)
- Fetch live state

Tools should:

- Be narrowly scoped
- Have strongly typed inputs
- Be explicit about side effects

**Skills: packaged procedures (+ code + assets)**

Use a skill when you want the model to:

- Follow a repeatable workflow
- Use scripts/templates
- Execute code in a sandbox
- Do it sometimes, not always
