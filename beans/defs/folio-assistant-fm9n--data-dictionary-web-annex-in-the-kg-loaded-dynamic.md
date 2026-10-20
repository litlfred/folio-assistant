---
# folio-assistant-fm9n
$schema: bean/1.0.0
title: 'Data dictionary web annex: in the KG, loaded dynamically (not the full workbook)'
status: todo
type: task
priority: normal
created_at: 2026-10-10T16:13:16Z
updated_at: 2026-10-10T16:47:37Z
parent: folio-assistant-uhkv
---

Owner 2026-10-10: dictionary.html should carry the data dictionary as a web annex. It should be in the KG and loaded dynamically, not as the full Excel. Existing infra:
- cat-harness-tools/scripts/tabular-records.py (stdlib xlsx reader, writes library/<slug>/tabular.jsonld: sheets, headers, shape);
- CSVW (tabular-csvw.test.ts);
- docs/assets/js/kg-render.js (three-state fetch + render);
- docs/assets/js/slice-sqlite.js (per-slice SQLite in the browser, OPFS-cached).
The IMMZ data dictionary workbook is near-template: 3 activity sheets, header names, not positions (bean sopq). Options are in the owner report; nothing built.


2026-10-10, BUILT (owner chose 2a):
- fhir-harness#33 (ea1ecd6): generic annexes (annexes.json beside menu.json; ig-annex.js loads the JSON on demand, textContent only).
- smart-base#36 (ab6de90): dak-data-dictionary.ts, a stdlib xlsx reader. 272 elements across 4 sheets, matching openpyxl row for row.
- smart-immunizations#18 (59ff964, seed branch): the annex + declaration.
Visible on the site once the fork's platform pin passes ea1ecd6 (48a6 / folio-assistant#2524). Follow-up: regenerate fhir-artifact-index/README.md (bootstrap-tools subgraph README).

_2026-10-20_ — (lane S, session_016heucWhrncLm4uy52csBcz, relayed by the drain coordinator session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6) The work is BUILT (fhir-harness#33, smart-base#36, smart-immunizations#18); what remains is the platform pin passing fhir-harness ea1ecd6 and regenerating `fhir-artifact-index/README.md`. Close once a re-pin shows the annex on the site; not closed here because the smart-immunizations half was on a seed branch and could not be confirmed from this checkout's mounts.
