---
doc_id: skills-in-openai-api-notebook
doc_title: "Skills in OpenAI API"
section_id: s011-operational-best-practices
section_title: "Operational best practices"
cells: 33-35
source_notebook: skills-in-openai-api-notebook.ipynb
source_sha256: b5162ce54fe14d57
granularity: heading
---
## Operational best practices

**1) Keep skills “discoverable”**

* Put a **clear** `name` and `description` in frontmatter.
* In `SKILL.md`, include: when to use, how to run, expected outputs, gotchas.

- Add explicit routing guidance: “Use when…” vs. “Don’t use when…”, and a few key edge cases, all in `SKILL.md`.

- Include negative examples (when the skill should *not* be triggered) alongside positive examples to improve routing accuracy.

- If routing feels inconsistent, iterate on name, description, and examples before changing code.

This came up in “bulk upload” discussions: name and description should come from frontmatter, and you should test with a small number first.

**2) Prefer zip uploads for reliability and reproducibility**

* Zips are portable, easy to version, and a useful workaround when uploads misbehave.

**3) Version pin in production**

You want to be able to say, “Run this procedure version,” not, “Run whatever the latest is.” Uploaded skills have **default_version** and **latest_version** pointers. Create new versions with `POST /v1/skills/{skill_id}/versions`; see [versioning and management](https://developers.openai.com/api/docs/guides/tools-skills#versioning-and-management).

* How to pin: `version: "2"`
* How to float: `version: "latest"`
* What happens when omitted: defaults to `default_version`

Consider pinning the model and skill version together for reproducible behavior across deployments.

**4) Design skills like tiny CLIs**

A good skill script:

* Runs from the command line
* Prints deterministic stdout
* Fails loudly with usage/errors
* Writes outputs to known file paths when needed

Add concrete templates and worked examples inside the skill (inputs → commands → expected outputs); the model reads these details when it invokes the skill, while discovery metadata remains part of the input context. When examples are workflow-specific, prefer examples and templates in skills over system-level, few-shot prompting.

**5) Avoid duplicating skills in system prompts**

If the system prompt repeats the entire procedure, people will:

* Bypass skills
* Stuff logic into tool schemas

And you lose the whole point (reusability + versioning + conditional invocation) of skills. Keep the system prompt content separate.

**6) Network access**

Combining skills and open network access is high-risk. If you must use network access, use strict allowlists and treat tool output as untrusted. Avoid this configuration for consumer-facing apps where users expect confirmation controls.
**If network access is required, pair allowlists with explicit “what data is allowed to leave” guidance.**

**7) Use a model that reliably executes multi-step workflows**

Skills work best when the model is strong at long-context reasoning and multi-step tool execution (filesystem navigation, CLI runs, verification).
If you see partial completion or brittle execution, upgrade the model or simplify the workflow, and add explicit verification steps and output checks in `SKILL.md`.

**Limits and validation**

- `SKILL.md` matching is case-insensitive
- Exactly one manifest file allowed (`skill.md`/`SKILL.md`)
- Frontmatter validation follows Agent Skills spec (name field)
- Max zip upload size: 50 MB
- Max file count per skill version: 500
- Max uncompressed file size: 25 MB
