---
# folio-assistant-ind9
title: Actor capabilities[] is overloaded — probes, permissions and skills in one field
status: todo
type: bug
created_at: 2026-09-18T20:07:20Z
updated_at: 2026-09-18T20:07:20Z
---

`.claude/skills/actors/*.json` carries `capabilities[]`, and it means three different things at once. Measured 2026-09-18 by `kg:audit`'s `actor-capabilities-resolve` criterion: 19 distinct names are claimed and never declared.

| what it really is | examples | count |
|---|---|---|
| ENVIRONMENT PROBE (the only declared kind) | `docker`, `pandoc`, `java-runtime`, `ig-publisher` | 23 declared |
| PERMISSION / AUTHORITY — no node kind models this | `approval-authority`, `admin-settings`, `release-authorization`, `review-comments`, `role-management`, `project-governance`, `first-pass-review`, `sme-coordination`, `clinical-validation`, `translation`, `release-management`, `qa-reporting`, `content-authoring` | ~13 |
| SKILL — already a node kind, wrong field | `bpmn-authoring`, `dmn-authoring`, `terminology-management`, `cql-authoring`, `data-dictionary-authoring`, `lean-diagnostics` | ~6 |

A declared capability has `detection: { method: "command", command: "…" }` — it is a thing you probe the environment for. `approval-authority` is not probeable and `bpmn-authoring` is a skill an actor's ROLE should carry.

This is the same shape as the `inherits` defect fixed in #271: one field carrying several meanings, so nothing can resolve it. The fix is to split the field, not to write 19 probe definitions — declaring them would invent content to satisfy a check.

## Done when
- [ ] `capabilities[]` holds only probeable capabilities
- [ ] the ~6 skill entries move to the actor's role in `skills/roles/roles.json`
- [ ] the ~13 permissions have a node kind, or are dropped as unmodelled
- [ ] `actor-capabilities-resolve` is clean and can be raised to critical
