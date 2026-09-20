---
# folio-assistant-w095
title: who-style-guide/ — the three one-voices out of cat-harness, citing who-iris across the boundary
status: todo
type: task
priority: normal
created_at: 2026-09-20T08:02:32Z
updated_at: 2026-09-20T08:02:32Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20: 'the 3 one-voices, should reference the 3 artefacts in the who-iris library, but the 3 one voices are derived from the cataloge and in their own repo/dir.' Dir name per the 2026-09-19 decision recorded in `r1lz`.

The three, with what each already cites (measured from `voices/*.json` this session):
- `who-editorial` -> `who-pub-tps-931` (WHO Editorial Style Manual, 1993)
- `who-guideline-development` -> `9789241548960-eng` (handbook for guideline development, 2nd ed, 2014)
- `who-publication-design` -> `wpr-rdo-2020-003-eng` (WPRO style guide, 2020)

`milnor` -> `milnorlink` does NOT move; different domain, different destination.

BLOCKED BY the cross-instance library reference. Doing this first produces three voices whose every rule cites evidence the check cannot resolve, which is the `source: null` defect `r1lz` was opened over, wearing a different hat.

## Done when
- The three voices live in `who-style-guide/voices/`, each citing `{ instance: 'who-iris', ... }`.
- `check:voices` green from BOTH instance roots.
- folio-assistant's own docs still carry NO voice (#208), and voices stay opt-in.
