---
# folio-assistant-fm9n
title: 'Data dictionary web annex: in the KG, loaded dynamically (not the full workbook)'
status: todo
type: task
priority: normal
created_at: 2026-10-10T16:13:16Z
updated_at: 2026-10-10T16:13:25Z
---

Owner 2026-10-10: dictionary.html should carry the data dictionary as a web annex. It should be in the KG and loaded dynamically, not as the full Excel. Existing infra:
- cat-harness-tools/scripts/tabular-records.py (stdlib xlsx reader, writes library/<slug>/tabular.jsonld: sheets, headers, shape);
- CSVW (tabular-csvw.test.ts);
- docs/assets/js/kg-render.js (three-state fetch + render);
- docs/assets/js/slice-sqlite.js (per-slice SQLite in the browser, OPFS-cached).
The IMMZ data dictionary workbook is near-template: 3 activity sheets, header names, not positions (bean sopq). Options are in the owner report; nothing built.
