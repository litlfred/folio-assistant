---
# folio-assistant-4tel
title: merge:main has no conflict pattern for translation-qa results, so it aborts
status: todo
type: bug
priority: normal
created_at: 2026-10-04T18:25:31Z
updated_at: 2026-10-04T18:25:31Z
parent: folio-assistant-d33q
---

Measured 2026-10-04 ~18:15Z merging main into `claude/gracious-mendel-du6nn8` after #2105: `merge:main` ABORTED on five conflicts it classified `[no declared pattern]` — `cat-harness/test/results/translation-qa/docs/installation.{ar,es,fr,ru,zh}.translation-qa.json`. Both sides had only regenerated them (55+/55- each side). Resolved by hand by taking main's copy, then regen-after-merge proved the result.

These are derived QA results like the `detangle` and `lsi` sidecars that `derived-results: take-base` already covers, so the gap is a missing glob, not a judgement call.

## Done when
- `merge-conflict-patterns.ts` classifies `*/test/results/translation-qa/**` as `derived-results: take-base` (or the pattern is widened to the whole declared results graph), with a test.
