---
# folio-assistant-1swy
title: 'QA: verdicts, sidecars and the audited review record'
status: in-progress
type: epic
created_at: 2026-09-19T11:43:44Z
updated_at: 2026-09-19T11:43:44Z
---

Where a verdict lives, what shape it has, and who is allowed to change it.

`2634` is the placement rule (provenance decides: a QA reviewer's output lives
under `test/results/`), `9gyz` is the shape (Finding, Decision and AuditNote are
three entities), and `cflw`/`nytj` are the two ways concurrent work corrupts the
record — 218 sidecars rewritten by one edit, and two PRs green alone but red
together because a sidecar records its auditor's hash.

`iumj` is the same failure reaching CI: an e2e fixture that reads the LIVE
corpus turns red when somebody adjudicates a finding, which punishes the review
it exists to support. `nba0` and `lfxa` are gaps in coverage; `sopq` is where
the DAK criteria come from.
