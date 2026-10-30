---
# folio-assistant-7mwa
$schema: bean/1.0.0
title: Retire qa:resolve-conflicts and the test/results .gitattributes entries; move the 14 per-instance test/results dirs and the folio_init template
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:46Z
updated_at: 2026-10-30T11:32:00Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-tfqf
---

Arc `3fva`, proposal §4 items 3.5 and 3.6. Blocked on the gates and readers beans.

There is nothing left to conflict, so `qa:resolve-conflicts` (`520m`) and the `oxka`/`eqxp` entries in `gitattributes.test.ts` are retired, with the reason recorded in `prepare-merge`.

The per-instance `test/results/` dirs (`folio-assistant-sci`, `fhir-harness`, `smart-*`, `who-*`, `agent-skills`, `large-datasets`, `folio-assistant-core`) gain `storage`. The `folio_init` / `qa-sweep` template writes it, and `qou` (`s3p2`, 3,653 verdicts) becomes the first downstream consumer. That is a separate repo, and it needs the author's go.

## Done when
- [ ] no gate or test references a committed `test/results` file
- [ ] a freshly initialised folio publishes to its own qa-reports branch



## From the reader audit (`gxvk`, 2026-10-01)
`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md` §5.7 lists the G-class sites:
- `qa-resolve-conflicts.ts:221-254,325`
- the repository attributes file, lines 7-77
- `regen-after-merge.ts:131`
- `gate-tree-guard.ts:8`: keep it; it catches gates that write in `--check`
- `templates/document/github/workflows/qa-sweep.yml:114`
- `folio-staging.yml:315`
- `qa-resolve-conflicts.test.ts` and the attributes test

`init-folio.ts:433,451` (the `folio_init` AGENTS template says "Commit") is also here. The reader beans this one now follows in practice are `folio-assistant-2gst`, `0dav`, `id4s`, `oq1j`, `8wj1`, `c8uq`, `tfqf` and `cxcn`.

_2026-10-16T06:30:00Z_ — Blocker `2ae2` (scrapped; replaced by `tfqf` and `8wj1`) swapped for those two, both still in progress. Owner ruling 2026-10-16 (item 3). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-23T13:53:00Z_ — Block lifted: `folio-assistant-8wj1` is completed (`cat-harness-tools#563`, `#564`, `#568` and `folio-assistant-core#177` merged).

_2026-10-30T11:32:00Z_ — Block lifted: `folio-assistant-oqe3` is completed (all 16 gates + 2 sidecar readers verified exiting 0 with `test/results/` absent on `folio-assistant` `main` `3bea400b24` following `cat-harness-tools#618`, `#622`, `#787` and the `folio-assistant` `#2681`–`#2726` re-pins).
