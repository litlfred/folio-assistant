---
# folio-assistant-61n5
title: qa-results parity test fails intermittently under bun run gates (2 of 4 local runs), never alone or in CI
status: completed
type: bug
priority: normal
created_at: 2026-09-23T07:09:46Z
updated_at: 2026-09-24T12:40:45Z
parent: folio-assistant-zzmr
---

The test "every family in the committed result matches the export's own field" in cat-harness/scripts/tests/qa-results.test.ts failed in 2 of 4 local `bun run gates` runs on 2026-09-23, on diffs that don't touch kg-export (the a1lq and 423d work). It passed 3 of 3 plain `bun test` runs, passes when run alone, and passed in CI every time.

It compares the committed kg-export.qa-results.json against a live buildExport(), so something that scans the repo is seeing transient state. Candidates:
- a gate step that runs before `bun test` and writes into the repo;
- a test that makes fixtures INSIDE the repo while bun runs files concurrently, for example cat-harness/schemas/harness-config.test.ts writes cat-harness/schemas/__test_folio_config__/.

## Done when
- [x] the failure is captured: it is a TIMEOUT, not a diff (see below). No diff exists to capture
- [x] the root cause is fixed deterministically; no test skipped or quarantined

## Summary of Changes — 2026-09-24

**It was the clock, not the tree.** The two candidates above (a gate step
writing into the repo, and in-repo fixtures) were checked and ruled out. A
stray module under `schemas/` left the parity test green, and gates runs its
steps one at a time. Four full `bun test` runs, logged:

| run | failures |
|---|---|
| 1 | `check-declaration-filename` › *this repository's own workflows carry no USE*, **5,561 ms** |
| 2–4 | none |

That test and the qa-results parity test are the same kind of test: each
computes over the WHOLE instance, and neither set a timeout, so each ran under
bun's 5 s default. Alone, the declaration scan took 3.4 s and `buildExport()`
2.3 s. Under a full run, one measured 4.44 s and one failed at 5.56 s. Its
assertion was never wrong. The parity test was not itself caught failing in these runs. The
bean's own evidence ("fails under gates, never alone, never in CI") is exactly
this mechanism, and the junit timings put it inside the same margin.

**The class is bigger than two tests.** A junit-timed full run shows about 20
tests at 1.9–3.2 s alone against the 5 s default, most of them whole-instance
exports.

**Fixes:**
- `schemas/test-preload.ts`: `setDefaultTimeout(20_000)`, which is more than 4×
  the worst time measured under load. It is not set in `bunfig.toml`, because
  bun 1.3.11 ignores `[test] timeout` there. That was measured with a 6 s test,
  which still failed at 5 s. The preload version was measured passing.
- `check-declaration-filename.test.ts`: the whole-repo scan is computed once
  for its three tests instead of three times. The file went from 10.8 s to
  about 5.8 s together with qa-results. The scan also gets an explicit, measured timeout.
- `qa-results.test.ts`: the parity test gets an explicit, measured timeout.

