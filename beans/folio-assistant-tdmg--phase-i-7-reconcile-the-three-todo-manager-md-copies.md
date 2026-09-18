---
# folio-assistant-tdmg
title: 'Phase I.7 — reconcile the three `todo-manager.md` copies (#223)'
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
---

`AGENTS.md` records three copies, diverging two ways:

| copy | lines | inbound refs | generated? | CI-gated? |
|---|---|---|---|---|
| `skills/folio-core/todo-manager.md` | 201 | 3 | no | indirectly |
| `docs/reference/skill-instructions/todo-manager.md` | 202 | 1 | yes | yes |
| `.claude/skills/local/todo-manager.md` | 167 | **5** | no | **no** |

The copy with the **most** inbound references has **no guard at all** —
`GROUPS` in `scripts/gen-skill-docs.ts` does not list `.claude/skills/local/`.
188 diff lines between `folio-core` and `.claude/skills/local/`.

Self-contained; unblocks nothing; it is how one of them quietly becomes wrong.
