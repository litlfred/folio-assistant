---
# folio-assistant-xlg2
title: 'RUN THE SAMPLE IMPORT: one real end-to-end instance of sample-import.bpmn, recorded, with a test'
status: todo
type: task
priority: high
created_at: 2026-09-24T18:01:44Z
updated_at: 2026-09-24T18:01:44Z
parent: folio-assistant-kupb
---

From the `v048` roast, objection 5. Placed under `kupb` by the owner, 2026-09-24.

**Measured:** `sample-import.bpmn` loads and renders, with skills and roles bound, but `beans/workflows/` holds **no** instance of it or of `materialize-remote`, no `.ts` file names it, and the three worked items arrived as owner uploads, not through it. `hfwl`'s Done-when asked only for a diagram, a skill and a render, so the owner's *"SDLC process to be developed for testing a sample import"* is a diagram that has never executed.

## Done when
- [ ] one sample import (fetch blocked by egress is acceptable: use an uploaded or fixture source) runs through `workflow_start` … `workflow_complete`, with the instance committed under `beans/workflows/`
- [ ] a test drives the process over a fixture, so a later edit that breaks it goes red
- [ ] every step the run could not perform here is recorded as such, not skipped silently
