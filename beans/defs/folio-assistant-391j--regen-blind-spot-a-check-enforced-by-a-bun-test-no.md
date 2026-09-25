---
# folio-assistant-391j
title: 'MERGE SKEW: two green branches merged into a red main (prov-qaqc, 2026-09-24) — not a regen blind spot as first diagnosed; owner decides merge queue vs up-to-date vs fix-forward'
status: completed
type: bug
priority: normal
created_at: 2026-09-24T06:06:37Z
updated_at: 2026-09-24T18:27:03Z
parent: folio-assistant-1xhc
---

Measured 2026-09-24. Main went red on 10b48aed (the #1246 merge) in `TypeScript — tests, lint, types`: the test `prov-qaqc: the real repository > the committed page and logs are current (what check:prov-qaqc gates)` failed. #1245 had added the report; 172b558d (#1190) then committed a new workflow instance without regenerating it. It was fixed by a pure regeneration in #1249.

**Why `bun run regen` missed it:** `regen-after-merge.ts` asks only the `:check` scripts that `gates.ts` loads from `code-quality-gates.yml`. `check:prov-qaqc` is enforced by a bun TEST, not by a workflow step, so regen never asks it. A branch that merged main and ran `regen` as instructed could still turn main red.

## Done when
- [x] ~~`regen` asks every `:check` that CI enforces~~. **Not needed:** it already does, and the premise was wrong (see the correction below).
- [x] ~~The same audit for other test-enforced `:check`s~~. **Not needed**, for the same reason.

## Correction, 2026-09-24: the diagnosis above is wrong

**`check:prov-qaqc` IS a CI workflow step** (`code-quality-gates.yml`, "PROV-O QA/QC report"), so `gates.ts` loads it and `regen` does ask it. The premise that it is enforced only from inside a test was false. I inferred it from the test's name and did not check the workflow.

**What actually happened was merge skew, measured:**
- Main went red at **`08fe2c68`**, the merge of #1245, one merge BEFORE mine. That run's `TypeScript — tests, lint, types` failed the same test.
- #1245's branch head `3d5f03d3` lacked `172b558d` (#1190's new workflow instance); main's parent `e5cf533d` had it. Each side was green alone. Their combination was a stale report, and it existed only after GitHub merged them.
- No `regen` on either branch could have seen it. My merge (`10b48aed`) was simply the next CI run on main.

**The real gap:** a PR is merged without being tested against the main it merges into. GitHub offers two remedies, both repository settings, so the owner decides:
- "require branches to be up to date before merging": each PR re-runs CI after merging main in. With several sessions merging every few minutes, that is a constant re-run.
- a **merge queue**: GitHub tests the combination before it lands. The workflows would need to trigger on `merge_group`.

The mitigation in use today is fixing forward fast: #1249 and #1257 each fixed a red main within minutes.

## Done when (re-scoped)
- [x] The owner decides: merge queue, up-to-date requirement, or fix-forward as policy (recorded here). **Decided 2026-09-24: fix forward.**
- [x] If a merge queue: the workflows gain `merge_group:` triggers. **Not applicable: the owner chose fix-forward.**

## Summary of Changes
The first diagnosis ("regen misses test-enforced checks") was wrong: `check:prov-qaqc` is a workflow step. The measured cause was merge skew. #1245's branch lacked #1190's workflow instance, so main was red at #1245's own merge (`08fe2c68`), one merge before the one that got blamed. The owner chose **fix forward** over a merge queue or an up-to-date requirement. `continual-progress` gains a section on it: watch main after every merge you make, fix a red main you find in a small PR of its own, and check the parent before blaming the last merge.
