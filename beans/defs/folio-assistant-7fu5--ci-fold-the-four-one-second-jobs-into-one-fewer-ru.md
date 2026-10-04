---
# folio-assistant-7fu5
title: 'CI: fold the four one-second jobs into one — fewer runner requests per run'
status: in-progress
type: task
priority: normal
created_at: 2026-10-03T16:14:26Z
updated_at: 2026-10-03T16:34:12Z
parent: folio-assistant-hfag
---

Measured on main run 37133247484 (2026-10-03, #2010 merge): 21.7 min wall for a run whose longest job executes 174 s. Runner WAIT dominates: first job queued 4.5 min; the two 1-s aggregator jobs waited 9.6 and 3.8 min. Each run asks for 18 runners. Four jobs do ~1 s of work after a ~13 s checkout: lean-bare-import, python-imports, rust-wildcard, dependency-advisories.

Owner chose option 1 (2026-10-03): fold them. Into ONE new job, not into gates: om30 keeps gates' steps from masking each other, and Task_* nodes are one-per-job.

## Done when
- [ ] one job `hygiene` runs all four; every gate step after the first is `if: ${{ !cancelled() }}`, so a red one masks none (om30); the Rust continue-on-error step is last
- [ ] code-quality-gates.bpmn: four tasks become Task_Hygiene, which the job claims; SVG regenerated
- [ ] bun run gates green; CI green; PR ready
- [ ] measured: runner requests per run 18 → 15
