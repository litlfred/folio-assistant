---
# folio-assistant-zevm
title: qa-criterion-hash real-module guard anchored its path at process.cwd(), which run-tests.sh moves
status: completed
type: task
priority: normal
created_at: 2026-08-24T17:25:12Z
updated_at: 2026-08-24T19:08:36Z
---

Pre-existing failure, surfaced while running the suite for the pypdf_safe work on branch claude/gracious-dijkstra-0ijp2l. Not caused by that change (its diff touches only PDF scripts and a skill doc).

scripts/tests/qa-criterion-hash.test.ts:110 'resolves criteria in the real voice checker module' fails: criterionSourceHash() returns null for both 'voice-scholarly-default' and 'wall-side-correct' against content/pipeline/qa-checkers-voice.ts. 744 pass / 1 fail.

Both keys DO exist in that module (lines 1167 and 1173), inside the record exported at line 1139. The other tests in the file, which run against a synthetic fixture, pass — so parseFile() works and it is findCriterionEntry() that misses on the real module.

Likely cause, not yet confirmed: qa-criterion-hash.ts documents itself as finding an exported '*_AUTOMATED_CHECKERS' record, but qa-checkers-voice.ts exports a bare 'AUTOMATED_CHECKERS' with no prefix, and that record leads with spreads of the sub-registries. The test's own comment says it exists to guard the fixture shape 'against drifting from how checkers are really written' — so the test is doing its job and the fixture is what drifted.

Consequence while open: every criterion in that module silently falls back to the whole-file hash, so any edit anywhere in a 1200-line file invalidates every criterion's cached QA result.


## Resolved — the stated cause and consequence were both wrong

Root cause is the TEST's path, not checker shape and not module shape. The
guard built `join(process.cwd(), "content/pipeline/qa-checkers-voice.ts")`, but
`scripts/tests/run-tests.sh` does `cd "$SCRIPT_DIR"` before `bun test`. Under
the canonical runner cwd is `scripts/tests/`, so it opened
`scripts/tests/content/pipeline/qa-checkers-voice.ts`, which does not exist.
`criterionSourceHash` returns null at the FIRST of its three exits —
`parseFile`'s `readFileSync` throws ENOENT and is swallowed — never reaching
`findCriterionEntry`. The test passed from the repo root and failed under the
runner; both were the same code.

Refuted: the bare-`AUTOMATED_CHECKERS` / leading-spread hypothesis.
`findCriterionEntry` walks every object literal in the module and matches on the
property KEY, so the record's name is irrelevant (`*_AUTOMATED_CHECKERS` in the
module docstring is prose, not a constraint), and the six spreads are trailing
and never consulted — the hashed entry is one property assignment. Given a
correct absolute path both ids resolve to distinct per-criterion hashes:
`voice-scholarly-default` 7e311e463351, `wall-side-correct` 37b3fa59a3bc, vs a
whole-file hash of 6c2d94255398.

Refuted: "every criterion in that module silently falls back to the whole-file
hash". Production never took that path. Both callers of
`computeCriterionScriptHashes` (`qa-sweep.ts`, `script-sweep.ts`) pass an
explicit `REPO_ROOT` derived from the module's own `__filename`, not cwd.
Verified by running the real sweep call from two different cwds: identical
per-criterion hashes both times, neither equal to the whole-file hash. The
cache churn described here was never happening; it was confined to the test.

Fix, both sides being well-formed: anchor the guard at
`resolve(import.meta.dir, "..", "..")` — the repo's documented idiom for a
PLATFORM path, and the one that survives a folio embedding this repo by symlink.
Added `expect(existsSync(...)).toBe(true)` so a wrong path names itself instead
of arriving as a null that reads exactly like the shape drift the guard exists
to catch. Assertions unchanged and unweakened; under the runner the guard now
exercises the real module for the first time.

Regression guard in `infrastructure.test.ts`: no `.ts` under `scripts/tests/`
may build a path with `join`/`resolve(process.cwd(), ...)` or `process.cwd() +`
(comments masked via `maskComments`; opt out with `allow-cwd-anchored-paths`).
Verified it flags the pre-fix source at line 114 and nothing in the current tree
(70 files scanned). Bare `process.cwd()` stays legal — several tests save and
restore it around `process.chdir`.

765 pass / 40 skip / 0 fail via `./scripts/tests/run-tests.sh`; eslint clean.
