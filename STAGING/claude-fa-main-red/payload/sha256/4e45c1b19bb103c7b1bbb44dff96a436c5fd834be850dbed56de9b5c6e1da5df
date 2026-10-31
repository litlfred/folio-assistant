---
# folio-assistant-5uyl
$schema: bean/1.0.0
title: Extract the immunizations L1 graph from DAK Component 1 into smart-immunizations/library
status: completed
type: task
priority: normal
created_at: 2026-10-06T08:58:14Z
updated_at: 2026-10-23T13:45:00Z
parent: folio-assistant-ioa4
---

## Done when
- [x] the DAK PDF is ingested by folio-assistant and its entry placed under smart-immunizations/library/
- [x] a generic extractor reads Component 1 (§1.1 interventions, §1.2 cited guidance) and resolves each (n) against the reference list
- [x] the graph validates with smart-kg tools/validate.mjs at WHO main AND the Zod validator in smart-base
- [x] every cited reference with a retrievable PDF is ingested into the same library; the rest are recorded with why not

## Progress 2026-10-06
- litlfred/smart-immunizations@a43629c (branch claude/happy-pasteur-pav8ba): library/ holds the DAK + (31) + (28); graph smart-kg-l1-dak-references.json, 52 nodes / 53 edges, conforms under smart-kg validate.mjs (WHO main 66a9b13) and the smart-base Zod validator.
- Item 4 open: (15) PAHO IRIS returned 403 and (26) (32) are on www.who.int, both denied by this session's network policy; (24) (29) are web pages, (30) a spreadsheet. Each is recorded in the graph with its URL.

## Closed 2026-10-21
- Landed on `litlfred/smart-immunizations` `main` (`litlfred/smart-immunizations#3`, `2026-10-06T14:58:22Z`, and `litlfred/smart-immunizations#57`, `3fbab2cd53`, mounted in `folio-assistant` at `smart-immunizations/library/`): all 3 retrievable IRIS PDFs (`9789240099456-eng` DAK, `9789240016514-eng` (31), `who-2019-ncov-digital-certificates-vaccination-20211-eng` (28)) are ingested into `smart-immunizations/library/` and pass `check:l1-complete`; the remaining cited references (`(15)`, `(26)`, `(32)`, `(29)`, `(24)`, `(30)`, `(22)`) are recorded in `smart-kg-l1-dak-references.json` (9 `publication` nodes) and `smart-immunizations/library/README.md` (*"Cited but not held, each recorded in the graph with its URL"*) with why not (network-restricted host fetches tracked separately in `folio-assistant-53rv`).


_2026-10-23T13:45:00Z_ — Status synced from `in-progress` to `completed` to match the folio-assistant copy of this bean, which is newer and records the work as done there. Only the status changed; the body here is kept as it was. Owner OK in thread "FHIR beans and WHO migration" (https://claude.ai/code/session_01Bye99WLJxQpyCxh2eMgW19).
