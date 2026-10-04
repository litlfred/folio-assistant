---
# folio-assistant-g5kt
title: 'REGEN FIXPOINT CAP IS SILENT: a run that does not converge prints CAP REACHED and exits 0, and the 3-pass default is below the measured need'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-04T07:15:24Z
updated_at: 2026-10-04T07:15:33Z
parent: folio-assistant-1xhc
---

Follow-on to 14ve, which fixed 'one pass only'. Two defects remain in the same loop.

1. SILENT NON-CONVERGENCE (the 1xhc shape). regen-after-merge.ts computes `settled` and prints '— CAP REACHED: the last pass still ran a writer, so the tree may not be settled', then exits on `unrepaired + no-writer` ONLY. `settled` is never consulted. So a run that genuinely could not reach a fixed point exits 0 and reads as clean, which is the standing could-not-determine rule broken by the tool that reports it.

2. THE BOUND IS BELOW THE MEASURED NEED. `regenToFixpoint(pairs, runner, 3)`: the loop runs while passes < 3 and sets settled only on a pass that ran NO writer, so 3 passes admits at most TWO writer-running passes. Measured 2026-10-04 by the merge sweep: skill:register needed a THIRD pass before its chain settled, which this default cannot reach.

MEASURED, so it is NOT part of this bean: the derivation itself is sound. repairableGates(loadGates(root,{all:true}), scripts) over 230 gates yields 107 pairs, and readme:subgraphs:check -> readme:subgraphs, check:term-mapping -> term:mapping, docs:harness:check -> docs:harness and skill:register:check -> skill:register all resolve. The three reds of 2026-10-04 were writers run BY HAND from memory instead of by `bun run regen`. 0 verify gates are unaccounted-for. The 17 `check:X:check` -> `check:X` pairs are correct: bo44 established that those bare forms write their sidecars.

## Done when

[ ] the CLI exits non-zero when the run did not settle, naming it as could-not-determine rather than clean
[ ] the default bound is above the measured need and is settable (--max-passes)
[ ] the exit decision is a pure, exported, tested function rather than inline CLI logic
[ ] a test asserts a chain needing three writer-passes settles under the default and does NOT under 3
[ ] the derivation census test is widened from the fast set to the whole gate set
