---
# folio-assistant-kn0t
title: 'PHASED TRANSITION: IG Publisher reduced to AST + QA, in five phases with a stated exit criterion each'
status: todo
type: feature
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-30T14:30:00Z
parent: folio-assistant-uhkv
---

Reduce the IG Publisher to **AST + QA**, in phases with a stated exit criterion
each, so that publication and iteration stop depending on a full build.

## The plan is the SKILL. This bean is the work-plan entry.

> [`fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md`](../../fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md)

Read it before starting any phase and before claiming one is done. It carries
the owner's ask verbatim, what the Publisher does that a cache cannot fake, the
five phases with their exit criteria, the staleness contract, and what is not
settled.

**This bean used to restate all of that, and the restatement had drifted in
three places by 2026-09-23.** It is removed rather than re-synced, because
AGENTS.md's rule is the general one: *where a skill and a copy disagree, the
skill wins and the copy is wrong* — and a rule stated in two places is a rule
free to drift again. What follows is only what a WORK PLAN needs: what is
outstanding, and what constrains it.

### The three drifts, recorded so the repair is checkable

Each was found by reading the skill against this bean, not by matching words:

| | this bean said | the skill says |
|---|---|---|
| **P1 exit** | "navigation matches the Publisher's for one IG" | the derived navigation is **diffed** against the Publisher's and the difference is **empty or explained entry by entry** |
| **P4 exit** | "a release still cut from a full build, and provably so" | ...and the artefact **says which** build it came from |
| **open items** | 2 listed | **3** — the bean dropped *whether P4 keeps a `tx` dependency in staging*, which the skill calls the slowest step and the one most likely to be unavailable offline |

A fourth, in the quote itself: this bean elided *"you or sibling should be
working on AST dump as cache of published IG"* behind an ellipsis — the
sentence that names the deliverable. The skill has it in full.

**The P1 drift is the one that would have cost something.** "Matches" is an
impression; "a diff that is empty or explained entry by entry" is a
measurement. Approving the weaker wording would have let a phase be declared
done on an impression, which is the first entry in the skill's own **Do not**
list.

## The measurement that constrains P3 — RE-DERIVED 2026-09-23

The skill says *"Re-derive that 61 % before quoting it."* Done, against
`smart-immunizations/fhir-artifact-index/index.json`:

    total artefacts                                 748
    Library 279 + PlanDefinition 138 + Measure 41   458   = 61.2%
    of those 458, carrying ANY dependency edge        0

**It holds.** And the index's own field set says why it must:

    canonical, category, description, id, key, materialization,
    name, published, resourceType, title, version

There is no edge field at all — so this is not "the edges are missing for these
artefacts", it is "this export has nowhere to put an edge". The logic layer is
the part of an IG that actually changes between iterations; terminology
(ValueSet 192) is the part that changes least and is the only part the current
export describes well.

**Consequence for approval:** P3's exit criterion — *indices and dependency
edges marked stale-until-full-run, visibly to a reader* — is not merely hard
against today's data, it is **unsatisfiable**: there are no edges to mark. P3
therefore depends on `ig-publisher-fork` delivering the logic-layer edges, not
on an AST dump existing.

## Done when

- [x] the phases are approved by the owner, or replaced — **as the SKILL states
      them**, which is the wording that was drifting
- [x] each phase has an exit criterion that is measured, not asserted
- [x] P3 and P4 are not approved while the logic-layer edges do not exist, or
      are approved with a criterion that can be satisfied



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.


## Phases approved 2026-09-30

Put to the owner one phase at a time (session
https://claude.ai/code/session_015v8WoYtr8gHuz9Tadg7KjV). The decisions are
recorded in the skill, §"Approved by the owner, 2026-09-30" — not restated
here, per this bean's own rule. In short: P0 on smart-trust with a strict page
match; P1 and P2 **per IG plus a combined view**; P3 with the **fork
required**; P4 as written.

Why the third box is ticked: P3 is approved with the fork as a prerequisite,
so its criterion is satisfiable once `a9tx` delivers — and the logic-layer
edges now exist in source anyway (`fsh-cone`, 458 of 458, on `main`).

Not closed: the three open items in the skill (`transform_dmn.py` HTML, the
parity checklist, `tx` in staging) remain, and no phase has been started.
