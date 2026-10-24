---
# folio-assistant-hfiu
$schema: bean/1.0.0
title: 'CI: a layer PR merges only after a green folio-assistant run with the change pinned'
status: in-progress
type: task
priority: normal
parent: folio-assistant-ksek
created_at: 2026-10-23T08:43:02Z
updated_at: 2026-10-24T14:03:00+02:00
---
Rule: a PR to a mounted layer (cat-harness, cat-harness-tools, folio-assistant-core, fhir-harness, bootstrap-tools, smart-*) does not merge until folio-assistant has run its PR gates with that layer pinned to the PR's commit (mount:remote --staging) and they are green. Otherwise the layer goes green alone and the re-pin turns folio-assistant main red. Status, 2026-10-23: another agent is building this check in cat-harness-tools (layer PR checks). This bean records the rule and links that work when its PR exists. Done when a layer PR without a green pinned folio-assistant run is refused by its own required check.

## Log
- 2026-10-24T14:03:00+02:00 — Claimed (`status: in-progress`) by Antigravity (`44190586-6f7e-4f91-bace-14f09541fa6a`). Auditing `layer-pr-checks.yml` across all mounted layers (`cat-harness`, `cat-harness-tools`, `folio-assistant-core`, `fhir-harness`, `bootstrap-tools`, `folio-assistant-sci`, `who-iris`, `smart-base`, `smart-trust`, `smart-immunizations`) and wiring any missing caller workflow.
