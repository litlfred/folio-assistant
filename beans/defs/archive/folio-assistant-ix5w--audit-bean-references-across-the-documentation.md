---
# folio-assistant-ix5w
title: Audit bean references across the documentation
status: completed
type: task
priority: normal
created_at: 2026-09-18T16:15:27Z
updated_at: 2026-09-18T16:44:13Z
---

From #203 comment 5731501752 (2026-09-18 14:31).

> "audit existing references to bean in docuemntatio and make sure
> illusrtated well."

Sweep every mention of beans across `AGENTS.md`, `skills/`, `docs/` and
`.claude/skills/` for consistency and for whether it is illustrated. Related
known hazard, already recorded in AGENTS.md: THREE copies of
`todo-manager.md` exist with a 188-line divergence between two of them, and
only one is CI-gated.
