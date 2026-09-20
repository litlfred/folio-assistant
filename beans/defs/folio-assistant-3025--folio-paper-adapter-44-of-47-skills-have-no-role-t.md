---
# folio-assistant-3025
title: 'folio-paper-adapter: 44 of 47 skills have no role — the package is unmodelled, not untriaged'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T14:49:49Z
updated_at: 2026-09-20T16:18:25Z
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

---

## Clustered 2026-09-20 — 44 skills are SEVEN decisions

Same treatment as `y1w9`'s folio-core 41: the bean said this needs a
modelling decision, so the useful preparation is to make that decision cheap
rather than to guess at it.

Every one of the 44 clusters, nothing left over:

| cluster | n | obvious home? |
|---|---:|---|
| **Lean formalization** — `formalizer`, `chapter-analysis`, `lean-generation`, `lean-substantive-pass`, `lean-build-fix`, `lean-cache-restore`, `lean-environment-setup`, `lean-mathlibext-curator`, `lean-formal-graph`, `proof-triage`, `category-theory`, `groebner-basis` | 12 | **no existing role** |
| **Proof review & audit** — `lean-proof-review`, `lean-proof-vacuity-audit`, `proof-gap-audit`, `proof-conciseness`, `proof-editor`, `proof-exposition-review`, `proof-simplifier`, `proof-narrative-lean-equivalence`, `lean-completeness-audit`, `remark-audit`, `definition-clarity-audit`, `proposition-consolidation-audit`, `critical-path-analysis` | 13 | **no existing role** |
| **Compute, witnesses & simulators** — `compute-audit`, `compute-author`, `ffi-roundtrip-audit`, `lean-witness-audit`, `witnessed-values`, `verify-local-substrate`, `simulator`, `simulator-math-audit` | 8 | **no existing role** |
| **Build & toolchain** — `build-docs`, `build-pdf`, `latex-build-cache`, `latex-validation` | 4 | **`build-pipeline`**, which already carries 14 |
| **Content QA** — `content-block-review`, `content-validation`, `rendering-auditor` | 3 | `reviewer` (9) or `content-reviewer` |
| **Integration watchers** — `proof-integration-watcher`, `q-usage-watcher` | 2 | same question as `y1w9`'s nine watchers |
| **Ingestion & status** — `paper-importer`, `proof-status-tracking` | 2 | `ingestion-agent` exists (2) |

### What this changes about the bean's framing

It said the package is **unmodelled**, and that stands — three of the seven
clusters, covering **33 of the 44**, have no existing role that plausibly
performs them. This repository has no formalizer lane, no proof-reviewer
lane and no compute lane, while the work plainly happens.

But four clusters (11 skills) have homes already, so the decision is not
uniformly hard. `build-pipeline` taking the four build skills is close to
uncontroversial.

### The caution still holds, and clustering makes it concrete

Do **not** create one paper role for 44. The three unhomed clusters are
three different performers: somebody who *writes* Lean, somebody who
*reviews* proofs, and somebody who *runs and audits computations*. Merging
them asserts one actor does all three, which is a lane no diagram would
draw — and `authoring-agent` at 34 is what that looks like when it happens
by accident rather than by decision.

### Done when

- [ ] the seven clusters are bound — three of them to roles that must first
      be written, with a `persona` saying what that performer already knows
- [ ] the watcher cluster is answered **consistently with `y1w9`'s nine**;
      eleven watchers across two packages is one question, not two
