---
# folio-assistant-bo44
title: 'WRITER-ONLY GATES: nine check scripts always write their sidecar and cannot fail on its content — the general form of uju6/i2kp'
status: todo
type: bug
priority: high
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:46Z
parent: folio-assistant-3fva
---

Arc `3fva`, proposal §4 item 0.3 and §4.3. The handover (session 01NtKBtj6Yk4kSTVMX3z2Tgy) named this sweep "the general form", and nobody has run it.

`uju6` classified 4 of 103 `check:*` scripts. It looked for misspelled writers, not for scripts that write their own sidecar, and so it missed `check:source-licence` (`i2kp`, #1751, draft #1753).

Measured at `61b1e747`: these writers have no judge mode and no `:check` twin:
- `check:wireframes`
- `check:layout-norms`
- `check:rendered-labels`
- `check:source-licence` (`i2kp`)
- `check:methodology-evidence`
- `check:lane-documentation`
- `check:l1-complete`
- `kg:export`
- `check:avatar-coverage`

**Why this is also step one of the arc:** once QA leaves main there is no committed copy to compare against, so every writer must be able to JUDGE a fresh run. Build the judge mode as "compute and judge" (four states: ok / finding / unknown / error), not as "compare with the committed file", so it survives the move unchanged.

## Done when
- [ ] each of the 9 has a judge mode with a stated four-state exit table
- [ ] each is wired into the gate set that CI runs (`gates.ts` derives it from the workflow)
- [ ] a test corrupts each one's input and sees exit 1
- [ ] `i2kp` is either folded in or closed on #1753's evidence
