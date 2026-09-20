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

## Open question for the owner

Whether this is **one** skill (`data-modelling`, a CRDM phase) or **two** —
the CRDM phase guidance, and a separate reusable skill on modelling
technique that the phase calls. The second reads like the platform/content
split applied again, but it is a judgement about the methodology rather
than about the code.

## Done when

- [ ] the one-or-two question answered
- [ ] skill authored under `folio-core`, platform-generic
- [ ] `crdm-data-model.bpmn`, called from `crdm-requirements.bpmn`, every
      activity carrying `<folio:skill ref>` and `<folio:role ref>`
- [ ] `render:bpmn` regenerated; `check:workflow-refs` and `kg:audit` clean
