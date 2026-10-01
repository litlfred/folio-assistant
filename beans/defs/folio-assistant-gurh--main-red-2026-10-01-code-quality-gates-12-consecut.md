---
# folio-assistant-gurh
title: 'MAIN RED 2026-10-01: Code-quality gates 12 consecutive failures since #1725, Docs site red — watchdog issue #1755'
status: todo
type: bug
priority: critical
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:46Z
parent: folio-assistant-3fva
---

Arc `3fva`, proposal `cat-harness/docs/proposals/qa-reports-branch-and-test-process-2026-10-01.md` §4 item 0.1. Measured 2026-10-01 at about 07:50Z, main `61b1e747`.

The last green Code-quality run was `27067b3fcb0` (#1725, 07:11Z). Since then main has failed 12 times in a row. The handover's "red from #1743" is out of date: #1725 turned it green, and it went red again from `a43d3b4e297` on.

Failing at head:
- Repository gates: the "workflow skill refs" step.
- End-to-end + accessibility: playwright.
- Skill-registration chain: "the registration chain is current, read unmasked".
- `bun test`:
  - `instance-declaration-gate.test.ts:99` (root does not reach agent-skills)
  - `layout-norms.test.ts:130` (smart-base/methodologies contains .../processes)
  - `skill-coverage.test.ts:195` (`l2-dak-authoring` uncovered)
  - `cat-harness.test.ts:1191` (core-/sci-methodologies were renamed)
  - `processes-viz.test.ts:239` (bootstrap-tools/processes appeared in the renders)
  - `ingest-and-l1.test.ts:405` (8 stale sources)
  - stale `gen-lsi-viz` and `qa-results`

Docs site: the "Regenerate skill instruction pages" step fails.

Inference, not yet verified: this is fallout from the placement merges #1758, #1760 and #1761 (session laughing-thompson, epic `iirv`), plus `a43d3b4`. **First check whether that session or #1747 (cmsl step 3) already owns the fix.** Do not duplicate it.

The watchdog (`kgho`) opened #1755 by itself at 07:24Z. That is the first production evidence that it works.

## Done when
- [ ] the owner of the fix is identified, or this bean claims it
- [ ] Code-quality gates and Docs site are green on main
- [ ] #1755 is closed by the watchdog when it sees green, and NOT by hand
