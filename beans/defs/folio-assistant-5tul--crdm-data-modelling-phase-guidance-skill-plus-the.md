---
# folio-assistant-5tul
title: 'CRDM: data-modelling phase — guidance skill plus the subprocess to hand it out'
status: todo
type: task
created_at: 2026-09-20T09:39:59Z
updated_at: 2026-09-20T09:39:59Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-20, on the CRDM process: *"and to data modeling guidance in
skills for CRDM when data modelling comes in (does subprocess exist yet?)"*.

## The factual half, answered

**Yes, the subprocess mechanism exists, and CRDM is already built on it.**
`crdm-requirements.bpmn` is a shell of four `callActivity` elements:

| call | into |
|---|---|
| `Call_Issue` | `Process_CRDM_Issue` |
| `Call_Needs` | Phase 1 — `Process_CRDM_Needs` |
| `Call_Requirements` | Phases 2–4, BPA + requirements |
| `Call_Signoff` | Phase 5 — beans + sign-off |

Ten diagrams across the corpus use `callActivity`/`subProcess`, and
`bpmn-processes.md` covers authoring one. So adding a data-modelling phase
is **a fifth call plus one new diagram**, not new machinery.

**No data-modelling activity exists anywhere in CRDM.** Zero matches for
data model / logical model / information model across all seven
`crdm-*.bpmn`. The phase is absent, not merely unbound.

## What this needs, and the order

1. **A skill first, then the diagram.** `bpmn-processes.md` requires every
   activity to carry `<folio:skill ref>`, so a `Process_CRDM_DataModel`
   with no skill behind it will not pass `check:workflow-refs`. The
   guidance is the deliverable; the diagram is how it gets handed to
   somebody.
2. **Where it sits.** CRDM phases 2–4 are BPA + requirements; a data model
   is what requirements are expressed *over*, so it plausibly belongs
   between them rather than after sign-off. Not decided here.
3. **What it must not be.** This repository is the PLATFORM. Data-modelling
   guidance that names FHIR profiles, DAK component tables or any one
   folio's vocabulary belongs in the folio, not here — the
   `platform-boundary-guard` rule. What generalises is the *procedure*:
   how to identify entities, where the model is declared, how it is
   validated, and how it binds to the content-object triple.

## Answered 2026-09-20 — TWO skills

Owner: *"2 twoskills"*.

So: a **technique** skill and a **phase** skill, and the split is the one
already load-bearing elsewhere here.

| skill | what it is | reused by |
|---|---|---|
| modelling technique | how to identify entities, relations and cardinality; where the model is declared; how it is validated | any process that models data, CRDM included |
| CRDM data-modelling phase | *when* in CRDM a model is built, what it is built from (the BPA and requirements of phases 2–4), who signs it off | `crdm-data-model.bpmn` only |

Why it matters beyond tidiness: the technique skill has **no CRDM in it**,
so a folio modelling data outside a requirements process can read it
without inheriting a methodology it is not running. The phase skill is
where CRDM-specific sequencing lives, and it is the one the diagram's
activities reference. That is the same shape as the platform/content split
the `platform-boundary-guard` enforces — the general thing must not carry
the particular caller's assumptions.

The phase skill CALLS the technique skill rather than restating it. Where
the two would disagree, the technique wins and the phase entry is wrong —
`AGENTS.md`'s own rule about a skill and its pointer.

## Done when

- [x] the one-or-two question answered — **two**
- [ ] BOTH skills authored under `folio-core`, platform-generic; the phase
      references the technique rather than restating it
- [ ] `crdm-data-model.bpmn`, called from `crdm-requirements.bpmn`, every
      activity carrying `<folio:skill ref>` and `<folio:role ref>`
- [ ] `render:bpmn` regenerated; `check:workflow-refs` and `kg:audit` clean
