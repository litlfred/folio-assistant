---
# folio-assistant-xxow
$schema: bean/1.0.0
title: 'Export page: list every exported file with its details, plus stable ''latest'' copies'
status: completed
type: task
priority: normal
created_at: 2026-11-05T12:58:58Z
updated_at: 2026-11-05T20:15:44Z
parent: folio-assistant-dthl
---

Owner: 'Export/ page ... Why doesn't show show what it can export with any filters, parameters in the UI'. Chose options 1 and 3: (1) export page listing each exported file with format, filters, parameters, size, date, link; (3) stable 'latest' copies. Code: folio-assistant-core scripts/document-export.ts. Then re-pin dth-hrh, republish, verify in Chromium.

## Progress 2026-11-05

- Implemented in the mounted copy of core (`folio-assistant-core/scripts/document-export.ts`, pin ade280d): every export now writes `<slug>-…-latest.{pdf,docx,json}` stable copies and an `index.html` Export page listing each file with format, purpose, filters (in order), parameters, size, date, commit, sha256, and Latest / This-export links. Manifest entries gain `latest`, `format`, `mediaType`, `purpose`, `filters`, `parameters`.
- New `scripts/document-export.test.ts` (3 tests) + existing docx-offline tests: 9/9 pass. Full release export of a 1-block sample folio verified; page screenshotted in Chromium at desktop and phone width (no sideways scroll; rows stack as cards on phones).
- BLOCKED: `add_repo` for litlfred/folio-assistant-core and litlfred/dth-hrh was refused by the session's permission classifier, so no core PR, no dth-hrh re-pin, no republish yet. Changed files are saved for hand-off. Not yet checked against core main (may have moved past ade280d; dth-hrh pin is c938217).
- Owner approved repo access (option 1). Core PR opened: litlfred/folio-assistant-core#645 (branch claude/export-page-latest, main merged in). Next: merge on green, re-pin dth-hrh (c938217 → merge commit), republish, verify live page.
- 14:19Z core#645 merged (21da85c). dth-hrh#103 re-pins c938217 → 21da85c (4 files, mount check passes); CI queued. Local real dth-hrh export with new code: 143-page PDF, 2162 lines, 494 bookmarks, Export page renders (screenshots sent). Next: merge #103 on green, dispatch site-publish, screenshot live page.
- 16:09Z dth-hrh#103 red: check:subgraphs, 23 broken links. Cause is core c081e35 (core#635, cat-harness sdlc/work-plan move) which lies between c938217 and 21da85c; dth-hrh's cat-harness pin febffc6 predates the move. Not #645. Explained on #103; asked owner: (1) narrow pin c938217+#645, (2) also move cat-harness pin (re-pin train), (3) hold.
- Owner (relayed, verified in parent transcript): "Also move cat-harness". Tried 35031e3 (14 broken) and 5e07b09 (6 broken: fhir-harness, smart-base, cat-harness-tools; tools' main not fixed). Asked again; owner chose "1. Narrow pin". Core branch claude/export-page-on-c938217 = c938217 + #645 (974958c). dth-hrh#103 now pins that (87ba3a3); check:subgraphs passes locally. Next: CI green → merge → site-publish → screenshots.
- 17:37Z dth-hrh#103 merged green (01db7a7). site-publish dispatched (run 42076453040); watching gh-pages for the deploy, then screenshots.


## Result (2026-11-05)
- core #645 merged; dth-hrh #103 merged (core pinned to 974958c).
- CI publish run 42076453040 failed at site:export (no pandoc on runner) -> bean v29t.
- Published locally with stage-local --main: gh-pages f8b42d5. en/dth-hrh/export/ has index.html, 4 *-latest.* copies and the 01db7a7 files. Screenshots sent.
- Known blemish: the site's page furniture injects a duplicated title link and an unstyled search box at the top of export/index.html (the page is self-contained, so the theme CSS is absent).
