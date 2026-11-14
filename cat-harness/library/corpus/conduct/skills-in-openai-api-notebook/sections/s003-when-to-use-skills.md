---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s003-when-to-use-skills
section_title: "When to use skills"
cells: 3-6
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
### When to use skills

**Skills are particularly appropriate and powerful when…**

1. **You want a reusable, independently versionable set of behaviors.**
Examples: “PowerPoint formatting procedure,” “company-specific report generator,” “standard data-cleaning pipeline.”
2. **Your workflow is highly conditional, or branches like a complex flow chart.**
Example: If X → do this; else if Y → do that; plus validation + retries.
3. **Your workflow needs code execution and local artifacts.**
Anything that benefits from scripts, templates, test fixtures, or reference assets that should live beside the instructions. Skills are designed as a zip of those resources.
4. **You want to keep system prompts slim.**
Put stable procedures in skills; keep system prompts for global behavior.
5. **Multiple agents or teams share the same “house style.”**
Skills are a nice “org standard library” pattern.
6. **You need reproducibility**
Skills are naturally compatible with version pinning via skill versions (see versioning section below).

**Skills are less ideal when…**

- It’s truly a **one-off** task (a quick inline script in the conversation is fine).
- You mostly need **live external data or side effects.** (That’s a tool/API call).
- The procedure changes every day (skills shine when the workflow stabilizes).
