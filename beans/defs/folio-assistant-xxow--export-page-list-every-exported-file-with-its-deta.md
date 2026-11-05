---
# folio-assistant-xxow
$schema: bean/1.0.0
title: 'Export page: list every exported file with its details, plus stable ''latest'' copies'
status: in-progress
type: task
created_at: 2026-11-05T12:58:58Z
updated_at: 2026-11-05T12:58:58Z
parent: folio-assistant-dthl
---

Owner: 'Export/ page ... Why doesn't show show what it can export with any filters, parameters in the UI'. Chose options 1 and 3: (1) export page listing each exported file with format, filters, parameters, size, date, link; (3) stable 'latest' copies. Code: folio-assistant-core scripts/document-export.ts. Then re-pin dth-hrh, republish, verify in Chromium.

## Progress 2026-11-05

- Implemented in the mounted copy of core (`folio-assistant-core/scripts/document-export.ts`, pin ade280d): every export now writes `<slug>-…-latest.{pdf,docx,json}` stable copies and an `index.html` Export page listing each file with format, purpose, filters (in order), parameters, size, date, commit, sha256, and Latest / This-export links. Manifest entries gain `latest`, `format`, `mediaType`, `purpose`, `filters`, `parameters`.
- New `scripts/document-export.test.ts` (3 tests) + existing docx-offline tests: 9/9 pass. Full release export of a 1-block sample folio verified; page screenshotted in Chromium at desktop and phone width (no sideways scroll; rows stack as cards on phones).
- BLOCKED: `add_repo` for litlfred/folio-assistant-core and litlfred/dth-hrh was refused by the session's permission classifier, so no core PR, no dth-hrh re-pin, no republish yet. Changed files are saved for hand-off. Not yet checked against core main (may have moved past ade280d; dth-hrh pin is c938217).
