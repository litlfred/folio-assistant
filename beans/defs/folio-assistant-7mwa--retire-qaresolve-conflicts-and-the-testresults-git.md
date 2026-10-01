---
# folio-assistant-7mwa
title: Retire qa:resolve-conflicts and the test/results .gitattributes entries; move the 14 per-instance test/results dirs and the folio_init template
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-01T08:00:55Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-oqe3
    - folio-assistant-2ae2
---

Arc `3fva`, proposal §4 items 3.5 and 3.6. Blocked on the gates and readers beans.

There is nothing left to conflict, so `qa:resolve-conflicts` (`520m`) and the `oxka`/`eqxp` entries in `gitattributes.test.ts` are retired, with the reason recorded in `prepare-merge`.

The per-instance `test/results/` dirs (`folio-assistant-sci`, `fhir-harness`, `smart-*`, `who-*`, `agent-skills`, `large-datasets`, `folio-assistant-core`) gain `storage`. The `folio_init` / `qa-sweep` template writes it, and `qou` (`s3p2`, 3,653 verdicts) becomes the first downstream consumer. That is a separate repo, and it needs the author's go.

## Done when
- [ ] no gate or test references a committed `test/results` file
- [ ] a freshly initialised folio publishes to its own qa-reports branch
