---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s012-conclusion
section_title: "Conclusion"
cells: 36-36
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
## Conclusion

Skills are the missing “middle layer” between prompts and tools: **prompts** define always-on behavior, **tools** provide atomic capabilities and side effects, and **skills** package repeatable procedures (instructions + scripts + assets) that the model can **mount and execute only when needed.**

**Use skills to keep your system prompts lean and your workflows durable.** Start small—bundle one stable procedure with a clear `SKILL.md`, make it runnable as a tiny CLI, and ship it. After it’s in production, pin versions for reproducibility, iterate safely by publishing new versions, and treat your skills library like an internal standard library: audited, discoverable, and shared across agents.

As users scale from single-turn assistants to long-running agents, skills help turn “prompt spaghetti” into **maintainable, testable, versioned workflows**—for building agentic behavior you can trust, reuse, and evolve over time.

To get started with Skills, check out our [documentation](https://developers.openai.com/api/docs/guides/tools-skills).
