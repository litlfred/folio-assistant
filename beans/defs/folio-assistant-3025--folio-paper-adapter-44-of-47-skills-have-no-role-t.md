---
# folio-assistant-3025
title: 'folio-paper-adapter: 44 of 47 skills have no role — the package is unmodelled, not untriaged'
status: todo
type: task
created_at: 2026-09-20T14:49:49Z
updated_at: 2026-09-20T14:49:49Z
parent: folio-assistant-8jt6
---

Measured 2026-09-20 while sampling for bean `y1w9`.

## The finding

`folio-paper-adapter` holds **47 skills and 44 are bound to nothing — 93 %.**
The 3 that are bound are scattered one-apiece across six unrelated roles
(`reviewer` 2, `authoring-agent` 1, `onboarding-agent` 1, `ingestion-agent` 1,
`evidence-agent` 1, `corpus` 1).

**That pattern is the point.** Six roles holding one paper skill each is not a
list with omissions — it is six incidental bindings and no owner. Extending an
existing role's list, which is what a triage would do, has nothing to extend.

Compare, same measurement, same day:

| package | on disk | unbound | |
|---|---:|---:|---:|
| `content-lifecycle` | 9 | 0 | **0 %** — fully modelled |
| `workflow` | 8 | 1 | 12 % |
| `authoring-who-smart-guidelines` | 7 | 1 | 14 % |
| `folio-core` | 107 | 43 | 40 % |
| **`folio-paper-adapter`** | **47** | **44** | **93 %** |

`content-lifecycle` at 0 % is the proof that this is achievable and that 93 %
is not the natural state of a package.

## Why it is not the `y1w9` triage

`y1w9` asks, per skill: missed annotation, or reference material nobody
performs? Seven paper-adapter skills were read in the sample — `build-docs`,
`content-block-review`, `groebner-basis`, `lean-environment-setup`,
`lean-substantive-pass`, `proof-gap-audit`,
`proposition-consolidation-audit` — and **every one is a performed task.**
None is reference material. So the question the triage asks has the same
answer 44 times, and answering it 44 times produces nothing.

The real question is the one underneath: **who performs paper work?** There
is no role for it. That is a modelling decision about the paper content type,
and it belongs to whoever owns that adapter — not to an annotation pass.

## Done when

- [ ] the roles that perform paper-folio work are named, with the same care
      `roles.json` entries already carry — a persona, and what the performer
      already knows
- [ ] the 44 are assigned to them, or explicitly declared `consulted: true`
      where a skill turns out to be reference after all
- [ ] `folio-paper-adapter`'s unbound count is reported alongside
      `content-lifecycle`'s 0 %, so the comparison that made this visible
      stays visible

## A caution for whoever takes it

**Do not create one role to absorb 44 skills.** A role is a BPMN swimlane —
"an actor performs a task in a process as a role" — so a role carrying every
paper skill asserts that one performer does all of it, which is a lane no
diagram would draw. `authoring-agent` already carries 31 and is the warning,
not the model.

## Not in scope

`folio-core`'s 43, which ARE a genuine triage: 64 of its 107 are bound, so
roles exist and these sit outside them. That stays on `y1w9`.
