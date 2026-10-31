---
# folio-assistant-hfiu
$schema: bean/1.0.0
title: 'CI: a layer PR merges only after a green folio-assistant run with the change pinned'
status: completed
type: task
priority: normal
parent: folio-assistant-ksek
created_at: 2026-10-23T08:43:02Z
updated_at: 2026-10-29T10:25:00Z
---
Rule: a PR to a mounted layer (cat-harness, cat-harness-tools, folio-assistant-core, fhir-harness, bootstrap-tools, smart-*) does not merge until folio-assistant has run its PR gates with that layer pinned to the PR's commit (mount:remote --staging) and they are green. Otherwise the layer goes green alone and the re-pin turns folio-assistant main red. Status, 2026-10-23: another agent is building this check in cat-harness-tools (layer PR checks). This bean records the rule and links that work when its PR exists. Done when a layer PR without a green pinned folio-assistant run is refused by its own required check.

## Summary of Landed Check & 11-Layer Audit (2026-10-24)

1. **Reusable workflow in `cat-harness-tools`:**
   - [`litlfred/cat-harness-tools/.github/workflows/layer-pr-checks.yml`](https://github.com/litlfred/cat-harness-tools/blob/main/.github/workflows/layer-pr-checks.yml) (landed in [`cat-harness-tools#206`](https://github.com/litlfred/cat-harness-tools/pull/206), [`#258`](https://github.com/litlfred/cat-harness-tools/pull/258), [`#360`](https://github.com/litlfred/cat-harness-tools/pull/360), [`#406`](https://github.com/litlfred/cat-harness-tools/pull/406), [`#411`](https://github.com/litlfred/cat-harness-tools/pull/411), [`#632`](https://github.com/litlfred/cat-harness-tools/pull/632), [`#635`](https://github.com/litlfred/cat-harness-tools/pull/635), [`#649`](https://github.com/litlfred/cat-harness-tools/pull/649), [`#662`](https://github.com/litlfred/cat-harness-tools/pull/662), [`#721`](https://github.com/litlfred/cat-harness-tools/pull/721)):
     - In `layer` mode, checks out `litlfred/folio-assistant` (`main`), mounts all instances from `index.lock.json`, swaps in the layer PR's commit (`mount:remote` / checkout), runs the index's root gates (`run-root-gates.py`: `root:lint`, `root:typecheck:instances`), `derive:publish`, and sharded `run-gates.py`, and compares against `main`'s stored answer in the `compare` (`No new failures (tests and gates)`) job.
     - In `cat-harness-tools` itself, `.github/workflows/pr-tests.yml` (`index-gates` job) runs the same pinned `folio-assistant` root gates.
   - Merge enforcement is performed by `bun run cat merge:guard <pr>` check 5 (`ci`, `cat-harness-tools/scripts/merge-guard.ts`, bean `uoob`), which refuses to merge any PR unless all `pull_request` workflow runs on its head SHA have completed with `success` or `skipped`.

2. **Audit across all 11 mounted layers in `folio-assistant/index.config.json`:**
   - 10 of 11 mounted layers (`cat-harness`, `cat-harness-tools`, `folio-assistant-core`, `smart-base`, `bootstrap`, `bootstrap-tools`, `who-iris`, `fhir-harness`, `folio-assistant-sci`, `smart-immunizations`) already had `harness-pr-checks.yml` / `pr-checks.yml` / `pr-tests.yml` on `main`.
   - **`smart-trust` was the sole mounted layer missing `.github/workflows/harness-pr-checks.yml`** (dropped when `smart-trust.json` was briefly removed in `336d0f3` on 2026-10-14 and not re-added when `smart-trust.json` returned on 2026-10-15).
   - Opened **[`litlfred/smart-trust#73`](https://github.com/litlfred/smart-trust/pull/73)** (`e9ef9b54`) adding `.github/workflows/harness-pr-checks.yml` calling `litlfred/cat-harness-tools/.github/workflows/layer-pr-checks.yml@main` (`mode: index`, `path-in-repo: .`, `tools-ref: main`, `draft-fast-tier: true`).

## Log
- 2026-10-24T14:03:00+02:00 — Claimed (`status: in-progress`) by Antigravity (`44190586-6f7e-4f91-bace-14f09541fa6a`). Auditing `layer-pr-checks.yml` across all mounted layers (`cat-harness`, `cat-harness-tools`, `folio-assistant-core`, `fhir-harness`, `bootstrap-tools`, `folio-assistant-sci`, `who-iris`, `smart-base`, `smart-trust`, `smart-immunizations`) and wiring any missing caller workflow.
- 2026-10-24T14:08:00+02:00 — Recorded `layer-pr-checks.yml` audit across all 11 mounted layers and opened [`litlfred/smart-trust#73`](https://github.com/litlfred/smart-trust/pull/73) (`e9ef9b54`) for `smart-trust`.

_2026-10-29T08:10:00Z_ — [`litlfred/smart-trust#73`](https://github.com/litlfred/smart-trust/pull/73) merged (`c4bc864`), so all 11 mounted layers now call `layer-pr-checks.yml`. Left: making the check REQUIRED (branch protection, an owner setting). Owner, 2026-10-29 07:20Z: *"merge all ready and then deal with aftermath"*, so whether a red check should refuse a merge is the owner's call. Lane B drain thread.

*2026-10-29T10:25:00Z* — Owner decision (card Q4, 10:19Z, Lane B thread): **"A. Signal only, close hfiu"**. The pinned-run check runs on all 11 layers (smart-trust#73 was the last) as a signal; it is not made a required check, and merges stay the owner's call, matching the owner's 07:20Z rule "merge all ready and then deal with aftermath". The "refused by its own required check" done-when is retired by that ruling. Closed. Session https://claude.ai/code/session_01Qmmkt7rXCDPexdBbNqeJqU
