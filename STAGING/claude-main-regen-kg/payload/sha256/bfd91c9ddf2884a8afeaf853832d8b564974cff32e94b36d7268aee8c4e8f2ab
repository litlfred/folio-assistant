# AGENTS.md — cat-harness

**Cold start, in order.** This file does not restate
[`README.md`](README.md) — that says what this layer *is*, and a description
written twice is a description one copy gets wrong. This says what to **do**,
and it augments rather than replaces the `AGENTS.md` at the root of whatever
checkout includes this layer. The rules that bind everywhere are skills of
this layer, so they are linked here rather than there:
[beans](skills/sdlc/sdlc-core/todo-manager.md),
[the opening brief](skills/sdlc/sdlc-core/opening-brief.md),
[process state](skills/process/workflow/process-state.md),
[continual progress](skills/sdlc/sdlc-core/continual-progress.md),
[context before the question](skills/conduct/conduct-core/interaction-modality.md).

1. **Get the work-plan CLI** — `cat-harness/scripts/install-beans.sh &&
   export PATH="$HOME/.local/bin:$PATH" && beans prime`. A fresh container has
   no `beans`, and the hand-parse fallback cannot claim or create anything.
2. **Claim before you work.** `bun run beans:claim <id>` — not
   `beans update --status in-progress`, which writes no holder note. A claim
   announces rather than reserves until your PR exists — see
   `bean-coordination`.
3. **Ask for the skill that governs the task** — `skill_list`, then
   `skill_fetch`. Do not open a path under `skills/` from memory: the graph an
   instance declares is what resolves, and a hardcoded path is how a skill
   goes missing the moment the layout moves.
4. **Say which process you are in**, every turn — the process, the lane, the
   task, and when you switch. `skills/process/workflow/process-state.md`.

## What is specific to THIS layer

> **cat-harness owns the harness; core owns content vocabulary.**
> A schema describing skills, workflows, roles or tools belongs here. One
> describing what a folio HOLDS, where it CAME FROM, or how much of it is
> present belongs in the content layer above this one, which links down to
> here and states the same split from its side.

Three rules that bind here before your first edit, each with its skill as the
text:

- **This is the platform, not a folio.** Subject matter — a chapter, a
  constant, a vocabulary — is either in the wrong repository or belongs in a
  folio as data. A literal naming one folio is the failure this layer exists
  to prevent.
- **A directory is declared or it does not exist.** Add one to
  [`cat-harness.json`](cat-harness.json) with its graph kinds in the same change;
  a declared-but-absent directory makes a consumer scan nothing and report a
  clean run. `kg-core/directory-conventions`.
- **The discipline lives in the skill.** Changing how agents behave means
  editing the skill, not a Markdown file at a root. Where a skill and any
  `AGENTS.md` disagree, **the skill wins and the file is wrong** — fix it.

## Which file answers which question

| you want | read |
|---|---|
| what this layer is, as a reader | [`README.md`](README.md) |
| what to do first, as an agent | this file |
| what the repository is, and every instance in it | the checkout root's `README.md` — not linked, because more than one repository includes this layer |
| the rules that bind everywhere | the skills linked at the top of this file; the checkout root's `AGENTS.md` points to them |
| durable facts a subagent owns | `.claude/agent-memory/<agent>/MEMORY.md` — injected, **first 200 lines only** |

That last row is the one distinction worth holding on to: **this file is read,
memory is injected.** Nothing truncates a file, so it carries what an agent
must be able to look up; memory carries what must arrive without being asked
for, and pays a budget for it. Maintaining both is one job —
`conduct-core/agent-memory`.

---

*A declared asset of this instance ([`cat-harness.json`](cat-harness.json), role
`agent-instructions`). Authored here — it is not a copy of
[`bootstrap/AGENTS.md`](../bootstrap/AGENTS.md); the repository root's
is. Issue #592.*
