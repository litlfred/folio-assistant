---
# folio-assistant-fc8y
title: state-drift.test.ts is intermittently red in a whole-file run, green in isolation
status: todo
type: bug
priority: normal
created_at: 2026-10-04T06:33:25Z
updated_at: 2026-10-06T06:26:49Z
parent: folio-assistant-fs43
---

Measured 2026-10-04 on `claude/beans-off-main-9ofm` (PR #2052), over an unmodified `driftOf`:

- `bun test cat-harness/scripts/tests/state-drift.test.ts` → 18 pass, **1 fail**: *"a file added on the BRANCH is drift too"*, failing its `expect(row.state).toBe("drift")`.
- the same test with `-t` → pass.
- the same whole file, re-run immediately → 19 pass.

So it is order- or state-dependent, not a wrong assertion. The suspects are shared across the file: every case opens a BranchStore over the same `BRANCH_STORE_DIR` for the run, `fetchTip` uses `--depth=1 --filter=blob:none` into a private ref, and this case pushes a SECOND commit to the same branch name from a differently-named local branch (`direct:refs/heads/cat/x/beans`). A tip cached or an object left over from a sibling case would produce exactly this: a comparison that finds the trees equal when the fixture says they differ.

Why it matters more than one flake: this gate is what stands between a stale seed and a cutover that silently resurrects superseded work (bean `9ofm` row C). An intermittent red teaches re-running until green, and a flaky guard is a guard nobody reads.

## Done when

- [ ] the cause is named (shared store dir / private ref / leftover objects), not just the symptom
- [ ] the file is green over 20 consecutive whole-file runs
- [ ] if the fixture shares a store on purpose, the sharing is asserted rather than incidental


## Re-measured 2026-10-06 on main at 2fdbb5109a — not closable yet
No cause is named anywhere (no commit or code mentions fc8y). `state-drift.test.ts` passed 5 of 5 consecutive runs (21/21 each); the 20-run bar in item 2 was not measured. Items 1 and 3 open.
