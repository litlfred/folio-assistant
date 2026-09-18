---
# folio-assistant-wwbl
title: 'Audit: which skills are not in the KG'
status: todo
type: task
created_at: 2026-09-18T22:22:06Z
updated_at: 2026-09-18T22:22:06Z
---


## The requirement, in the author's words (2026-09-18)

> audit if other skills are not in the KG

## Leads already in hand (measured 2026-09-18, this branch)

- **`bun run kg:export` reports 3 dangling `declaresSkill` edges** — a node
  declares a skill that does not resolve:
  `skill/scientific-visualization`, `skill/hypothesis-generation`,
  `skill/scientific-critical-thinking`. Reported and non-fatal today.
- **`.claude/skills/local/` is outside every guard.** `GROUPS` in
  `scripts/gen-skill-docs.ts` lists `skills/content-lifecycle`, `src/skills`,
  `skills/folio-core` and the two adapter dirs — not `.claude/skills/local/`.
  `AGENTS.md` measures that this is where the copy with the MOST inbound
  references lives (`todo-manager.md`, 5 refs, 188 diff lines from the
  `folio-core` copy) with no check on it at all.
- **`scripts/known-skills.ts`** is the one answer to "what counts as a skill",
  shared by `kg-audit` and `check-workflow-refs`. It is the right place to
  measure against, and `.claude/skills/` is deliberately NOT uniformly skills
  (`actors/`, `capabilities/`, `roles/`, `hooks/` are other node kinds).
- **`kg:audit` already reports 6 skills nothing reaches** (minor). That is the
  reverse direction — in the KG but unreferenced — and belongs in the same
  report so both gaps are read together.

## Done when

The audit distinguishes three states and never renders the third as a pass:

1. a skill file that is a KG node and is reachable;
2. a skill file that exists but is **not** a node (the gap this bean names);
3. **could not determine** — a directory that is not uniformly skills, a file
   that will not parse.

...and reports the dangling-reference direction (a node naming a skill that is
not there) alongside it, since kg-export already finds three.
