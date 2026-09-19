---
$schema: folio-memory/v1
id: a-diagnostic-must-not-wear-a-findings-grep-string
label: trap
summary: "a 'could not check' notice reusing a finding's wording inflates the census it protects"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
Consumers count findings by grepping the message, so a status line carrying the
finding's phrase is counted as one.

Measured 2026-09-19: a "could not read the results tree" warning worded with
`orphan QA sidecar` turned ten assertions red — it inflated the orphan census
the check exists to keep honest. Name the check by its **id** in a diagnostic,
never by the finding's phrase.
