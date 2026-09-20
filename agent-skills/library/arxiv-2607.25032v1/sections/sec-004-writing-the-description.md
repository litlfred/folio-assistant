---
doc_id: arxiv-2607.25032v1
doc_title: "Authoring Agent Skills: A Software-Engineering Approach"
section_id: sec-004-writing-the-description
section_title: "Writing the description"
section_number: null
pages: 4-5
source_pdf: 2607.25032v1.pdf
source_sha256: 449a2e29e68b0916
---
Because the description is the trigger, it deserves more care than any other part of the skill. Write
it in the third person, since it is read by the model as part of its own context, and a first or second
person voice can degrade matching. State both what the skill does and when it should be used,
and include the concrete terms a relevant task would contain.
A description such as “Handles releases” gives the model nothing to match against.
A
description such as “Drafts release notes from the pull requests merged between two version tags.
Use when cutting a release, updating a changelog, or summarising what changed in a version”
names the operations and the triggers, so the model can select it against a real request [3].
4
Explicit invocation.
If a skill should run only when called by name, Claude Code allows the
frontmatter to disable automatic invocation, which turns the skill into an explicit command [5].
Use this for actions that should never fire on the model’s own judgement.
6
