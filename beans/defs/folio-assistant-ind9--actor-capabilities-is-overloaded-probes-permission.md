---
# folio-assistant-ind9
title: Actor capabilities[] is overloaded — probes, permissions and skills in one field
status: completed
type: bug
priority: normal
created_at: 2026-09-18T20:07:20Z
updated_at: 2026-09-18T20:31:24Z
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
- [x] `capabilities[]` holds only probeable capabilities
- [x] the skill entries are resolved — 3 were already on the right role, 3 do not exist (bean `dtod`)
- [x] the 13 permissions have a node kind — `skills/permissions/permissions.json`
- [x] `actor-capabilities-resolve` is clean and raised to critical

## Summary of Changes

`actors[].capabilities` is split into three fields that answer three questions:

| field | question | scope |
|---|---|---|
| `roles` | what may it act **AS**? | per lane |
| `permissions` | what may it **DO**? | every lane |
| `capabilities` | what does its **machine have**? | the environment |

**The fix proposed in this bean was wrong, and testing it is what found the
right one.** The bean says permissions should move to the Role — "can review" is
a property of a position, the same reasoning that moved `inherits` off actors in
#271. That does not survive the data. A permission **cross-cuts** roles:
`content-authoring` is held by actors taking on five different roles;
`qa-reporting` by three, one a build pipeline and one a human QC reviewer; and
`admin` holds `admin-settings` in all five lanes it enters. Placing them on Role
produced **36 conflicts** where a permission was held by some but not all actors
sharing a role.

The distinction that does hold, and is now written into `role-model.md`:
**a skill answers what the performer of this task needs to KNOW and belongs to
the lane; a permission answers what this participant may DO and travels with the
participant through every lane it enters.**

**Corrections to this bean's own numbers**, measured rather than estimated:

| this bean said | actually |
|---|---|
| ~6 skills in the wrong field | **3** — `bpmn-authoring`, `dmn-authoring`, `terminology-management`, and all three were **already carried by the right role**, so removing them lost nothing |
| — | **3 more** (`cql-authoring`, `data-dictionary-authoring`, `lean-diagnostics`) are skills with **no body anywhere**. Dropped rather than relocated; bean `dtod` |
| ~13 permissions | 13, confirmed |

**Shipped:** `skills/permissions/permissions.json` (13 declared, each with what
it means and why it is separate from its neighbour — `review-comments` vs
`approval-authority`, `release-authorization` vs `release-management`);
`permissions?: string[]` on `ActorDefinition` + Zod + `readPermissions`;
criterion `actor-permissions-resolve` (critical); `actor-capabilities-resolve`
**raised to critical**, which it could not be while the field was overloaded.
Six new tests, including one pinning the cross-cutting measurement so a future
change cannot quietly reintroduce the 36 conflicts.

Audit: 247 pass / 14 fail / 45 n/a / 0 unknown. No critical. `kg-export`'s
dangling internal links drop from 4 to 3, and the remaining 3 are remote-package
skills that are correct by design.
