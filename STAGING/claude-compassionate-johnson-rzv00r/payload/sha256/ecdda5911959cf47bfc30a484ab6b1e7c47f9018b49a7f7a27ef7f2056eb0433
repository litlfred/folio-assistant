---
# folio-assistant-8qyc
title: 'REGEN DUPLICATED WORK + BARRIERS: skill:register:check re-runs sub-checks regen also asks; un-barrier read-only checks; narrow inputs'
status: in-progress
type: task
priority: high
created_at: 2026-10-05T05:24:07Z
updated_at: 2026-10-06T10:47:25Z
parent: folio-assistant-xpcu
---

## Why
Owner goal 2026-10-05: minimise regen time while staying sound (never a false green). Measured (stream B, main, --jobs 1 --no-cache): 117 pairs, 637 s serial. skill:register:check (107 s, barrier) re-runs ~9 checks regen also asks separately; kg:audit:check (80 s) may be a subset of kg:audit:all:check (198 s); several none/barrier pairs (check:published-instance-exports 49 s, subgraph:jsonld 14.5 s, kg:export 12.6 s, slice:sqlite 11.8 s, kg:locale 7.9 s, render:bpmn 5.4 s) serialize the pool.

## What
1. Remove duplicated work between skill:register:check and regen's own pairs, and between kg:audit and kg:audit:all, keeping every artefact verified every run.
2. Declare outputs: [] in task-io.ts for checks measured read-only.
3. Narrow inputs only where the import closure provably reads only those files.
4. Cheap speed-ups inside the slow checks.

## Done when
- PR from claude/zealous-gates-3o9ma2-io-decls with before/after regen timings (default jobs and --jobs 1, same tree, load noted) and a soundness argument per skip/un-barrier.
- Coordinated with stream C (regen --changed, changed-paths.test.ts): no edits to its --changed logic.

Holder: claude/zealous-gates-3o9ma2-io-decls (session https://claude.ai/code/session_01VfkKocGaQW7Msro2t5S66U), 2026-10-05.


## 2026-10-06

**Landed on main (#2144, read in `pair-cover.ts` and `task-io.ts`, and seen in regen output):** item 1 for regen. `skill:register:check` and `kg:audit:check` are folded, so their verdicts are DERIVED from their residual plus coverers. Item 2: every gated regen pair now declares `outputs: []` ("115 have read-only checks and may share the pool"). Item 3: the five slow env-reading pairs deliberately declare no `inputs`.

**Still open, measured (local branch `local/regen-speedup`, Bun 1.3.14):**
- `bun run gates` still runs both folded checks whole, and runs `skill:register:check` TWICE, because two CI jobs list it. In a base gates run (d82b69e11, load 4-5) they took skill:register:check 88.1 s (x2), kg:audit:check 58.7 s and kg:audit:all:check 106.6 s.
- 8dd50a7a7 (bean f017) now SKIPS the second `skill:register:check` in gates when the first passed on the same inputs. That is measured: both instances were skipped in a second gates run on an unchanged tree.
- regen records NO check-level entry for a derived (folded) verdict, so gates still runs `skill:register:check` once after a regen.

**Decision for the owner:** should `gates` (local only; CI is untouched) apply the same fold? It would save about 150 s of CPU per gate run. Folding `kg:audit:check` into `kg:audit:all:check` needs only the argument already accepted for regen. Alternatively, should regen's derived verdict be allowed to populate gates' skip record? Neither is done here: pair-cover.ts says the gates question is "put on the PR rather than decided here".
