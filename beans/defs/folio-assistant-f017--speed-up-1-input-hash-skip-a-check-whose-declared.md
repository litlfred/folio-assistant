---
# folio-assistant-f017
title: 'SPEED-UP 1: input-hash skip — a check whose declared inputs are unchanged since its last green run is skipped and says so'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T17:42:23Z
updated_at: 2026-10-06T19:02:56Z
parent: folio-assistant-7x5n
---

Owner approved 2026-10-01 late (~17:30, session_01ToWZR4RgTRCWeSsgxsSQfT) as speed-up 1 of 4 for the merge treadmill (S2 `0mf0`, epic `7x5n`). Siblings: parallel checks, CI merge:main (`d33q` part B), CI sharding + BPMN cache + shallow checkout.

## What
Each verify/write pair that `bun run regen` / `bun run gates` runs records a hash of its declared INPUTS (the files it reads plus its own script) next to its output. When the hash is unchanged since the last green run, the check is skipped and reported as `skipped (inputs unchanged)` — a distinct state, never rendered as `current`.

## Why
A merge → regen → gates cycle takes ~50–80 min of agent wall-clock on a loaded 4-core box (d33q's measurement, 2026-10-01) while main moves every ~3 min. Most pairs' inputs do not change between two rounds of the same branch.

## Falsifier
A check whose real inputs are wider than its declared inputs would be skipped while stale. So: the input set must be declared, not inferred, and a test must show that editing an undeclared-but-read file is caught (or the check refuses to skip when it cannot enumerate its inputs — the third state, never "unchanged").

## Done when
- [x] input-set declaration per pair, and the hash store (committed or cache, decided with reasons)
- [x] `regen` and `gates` skip on an unchanged hash and say so
- [x] a test per refusal case (inputs not enumerable → runs)
- [x] measured: regen wall-clock before/after on the same tree


## 2026-10-06

The boxes were ticked on these measurements. Bun 1.3.14 throughout.

- **Declaration and store:** on main since #2112. `task-io.ts` declares inputs. The store is a local cache at `build/regen-cache/input-hashes.json`: never committed, and off under `CI`. The reasons are in the `input-hash.ts` docblock.
- **regen skips:** on main.
- **gates skips:** NEW on local branch `local/regen-speedup`, commit 8dd50a7a7, not on main yet.
  - The cache gains `checks`: a check script's own fingerprint, recorded only from a run that exited 0 with the same fingerprint before and after it ran.
  - regen records an entry only for checks it actually RAN green in a settled run. It never records one for a skipped, `--changed`-assumed or pair-cover-derived verdict.
  - Both commands read the entries. gates prints `SKIPPED — inputs unchanged since this check last passed` and counts skips apart from passes.
- **Measured skips (load 4-13):**
  - gates after regen skipped 9 of 251 gates.
  - gates run again on the same tree skipped 10, including the duplicate `skill:register:check`.
  - `kg:audit:all:check` and `translation:block-qa:check` were correctly NOT skipped. Their `--against main` qa-reports baseline moved between the two runs.
- **Refusal tests:** in `cat-harness/scripts/tests/task-pool.test.ts`, the block "COULD NOT DETERMINE is never clean", plus the new block "f017: check-level records".
  - Each of these is edited in a fixture git repo and must make the check RUN: a declared input, a new glob match, the script, an imported module, any tracked or untracked file under `{tracked}`, and a moved baseline.
  - A red run, or inputs that move mid-run, record nothing.
  - Undeclared, undetermined, not-exactly-one-script and cache-off gates never skip.
- **Regen before/after, same tree (4312e99c7):** cold cache 396 s wall, 537 s user, 181 s sys (load 2-9). Warm cache 231 s wall, 306 s user, 107 s sys (load 8-10), with 13 pairs skipped.

**Falsifier, unchanged:** a script that reads something its declaration does not name. All 15 skippable declarations are `{tracked}` (whole tree), so the remaining exposure is ignored files, the environment, the network and the clock. `task-io.ts` excludes declaring inputs for those by rule.

Status is left as is: the gates half is not on main until `local/regen-speedup` is merged.

_2026-10-06T19:02:53Z_ — Claimed by claude/f017-input-hash-coverage — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
