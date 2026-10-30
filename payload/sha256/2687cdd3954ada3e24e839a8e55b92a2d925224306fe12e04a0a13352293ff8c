---
# folio-assistant-6g6o
$schema: bean/1.0.0
title: 'CI: PR-time Liquid undefined-variable and post-merge regen checks block before merge'
status: in-progress
type: task
priority: normal
parent: folio-assistant-ksek
created_at: 2026-10-23T08:43:02Z
updated_at: 2026-10-24T15:05:00Z
---

Rule: a check that today runs only after merge gets a PR-time half wherever it can run on a PR, counted by merge-guard. PR: https://github.com/litlfred/folio-assistant/pull/2633 (branch claude/pr-time-postmerge-checks, head 7d2ea91). What it does: liquid-undefined.yml is called (workflow_call) as a job of Feature Staging's own run after stage hands off the Jekyll source, so a red check makes the PR's Feature Staging red and merge-guard check 5 refuses it once finished. Its workflow_run keeps only the Docs site, main's own render. Staging PR paths gain uploads/** and liquid-undefined.yml. Cost is about 1.5-3 min on one runner after stage. For post-merge regen, all 122 repairable :check pairs it asks are already PR gates; what no PR ran is the three UNGATED_INPUTS writers (library:viz, schema:viz, uploads:viz), now the last step of gates-unrun (about 12 s). Their :check halves stay ungated per the 2026-09-20 ruling. Cannot run on a PR: main after the merge. Open: merge-guard does not wait for Feature Staging (bean gnnj), so the Liquid verdict is judged once that run finishes. Done when #2633 merges and a PR with an undefined-variable plugin failure is shown red before merge.

_2026-10-24T15:05:00Z_ — Verified post-merge CI evidence:
- [`litlfred/folio-assistant#2633`](https://github.com/litlfred/folio-assistant/pull/2633) merged at `2026-10-24T07:28:58Z` (`57adbcfd797c42d2827c1cebc632d203d7ef9cf0`).
- In-run `workflow_call` job `Liquid undefined-variable check / Undefined Liquid variables in the rendered source` under `Feature Staging (GitHub Pages)` (`pull_request`) ran and succeeded post-merge on run `40078913707` (job `120839139921`, `conclusion: "success"`) and run `40092290263` (job `120871740596`, `conclusion: "success"`), as well as across 7 heads on `#2633` (`40071694436`, job `120811380287`).
- Step 30 of `Repository gates — registered, never run elsewhere (hard)` (`"post-merge regen, PR-time -- the ungated projections' writers run"`: `library:viz`, `schema:viz`, `uploads:viz`) ran and succeeded in `Code-quality gates` runs `39958384435` (job `120443211613`, 9s) and `39965584328` (job `120463998394`, 10s). Kept `in-progress` pending a PR with an undefined-variable plugin failure shown red before merge (and bean `gnnj`).
