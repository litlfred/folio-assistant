---
$schema: folio-memory/v1
id: never-assert-on-a-qa-verdict-from-the-published-corpus
label: trap
summary: "never assert on a QA VERDICT from the published corpus"
createdAt: 2026-09-19
roles:
  - build-pipeline
  - validation-pipeline
agents:
  - content-pipeline-navigator
---
`docs/assets/qa/**` is live state. A test that reads a VERDICT out of it breaks
when somebody fixes or adjudicates the finding — which is the system working.

> Measured on 2026-09-19 (bean `tywj`): `tests/qa-panel.e2e.ts` pinned the first
> row to `voice-status-leak`/`fail`/`critical`, the fold count to `47` and the
> checker hash to `5af6856733f3`. An adjudication in `c8fbad385` turned that
> criterion `pass`; four assertions went red for reasons unrelated to the panel.

**Read the document live; flip the ONE criterion you test, BY ID, where it
sits.** The settled answer (#319) keeps only the script witness, so the hash the
spec asserts is still the corpus's own.

**Do not freeze a captured copy.** I tried it and withdrew it: freezing the
criterion freezes its witness, so the hash literal outlives the checker — the
same defect one field down. Reading the value out of a frozen document makes the
assertion self-consistent, not correct.

**Never hoist the failure to `criteria[0]`.** The generator already sorts
worst-first, so a panel that sorted nothing would pass.

`severity`, `evidence` and `changed` exist only in states the corpus is not in,
so no live sidecar vouches for them. Beans `tywj`, `qjyi`, `iumj`.
