---
# folio-assistant-xlg2
title: 'RUN THE SAMPLE IMPORT: one real end-to-end instance of sample-import.bpmn, recorded, with a test'
status: completed
type: task
priority: high
created_at: 2026-09-24T18:01:44Z
updated_at: 2026-09-30T00:13:47Z
parent: folio-assistant-kupb
---

From the `v048` roast, objection 5. Placed under `kupb` by the owner, 2026-09-24.

**Measured:** `sample-import.bpmn` loads and renders, with skills and roles bound, but `beans/workflows/` holds **no** instance of it or of `materialize-remote`, no `.ts` file names it, and the three worked items arrived as owner uploads, not through it. `hfwl`'s Done-when asked only for a diagram, a skill and a render, so the owner's *"SDLC process to be developed for testing a sample import"* is a diagram that has never executed.

## Done when
- [x] one sample import (fetch blocked by egress is acceptable: use an uploaded or fixture source) runs through `workflow_start` … `workflow_complete`, with the instance committed under `beans/workflows/`
- [x] a test drives the process over a fixture, so a later edit that breaks it goes red
- [x] every step the run could not perform here is recorded as such, not skipped silently

_2026-09-29T22:26:13Z_ — Claimed by claude/magical-archimedes-4qkfxp-xlg2 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Merged in #1510 (`e390d52`). `sample-import.bpmn` ran for real twice through the real workflow tools, both runs committed under `beans/workflows/`: whole WPRO item → refused at the gates (derived cover's `sourceLoss` unknown); PDF only → imported as a trial in `fsh-guts/samples/`. `sample-import-check.ts` (count / identifiers / structure / provenance with re-computed fixity), `sample-import-run.ts` (drives the real handlers; fetch recorded NOT PERFORMED with verified substitution), `sample-import-run.test.ts` (fixture: refused / imported / tampered). Also fixed out-of-root instance source resolution in the workflow tools.
