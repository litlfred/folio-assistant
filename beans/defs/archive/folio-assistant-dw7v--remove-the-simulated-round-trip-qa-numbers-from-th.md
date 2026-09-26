---
# folio-assistant-dw7v
title: Remove the simulated round-trip QA numbers from the translation nodes
status: completed
type: task
priority: normal
created_at: 2026-09-18T22:01:29Z
updated_at: 2026-09-18T22:09:28Z
---

Asked directly on 2026-09-18: 'remove fake data'.

`translations/fr/index.ts` records roundTripQA { pass: 11, warn: 4, fail: 21, total: 36, method: 'jaccard-word-overlap' } and `agent-onboarding.ts` records { 22, 3, 1, 26 }. Both are stamped into docs page front matter as qa_translation_* and rendered as a QA badge under the page title.

Measured: `simulate-translation.ts` holds a HAND-WRITTEN BACK_TRANSLATIONS map with 6 entries against 36 msgids. Every string with no back-translation is scored similarity 0 and recorded as drift — so the 21 'failures' are mostly strings that were never back-translated at all. The numbers measure absence, not semantic drift.

Superseded by the per-block translation-qa/v1 sidecars (#278), which carry real witnesses.

## Summary of Changes

Removed the numbers, the field that held them, the badge that displayed them,
and both scripts that produced them — so nothing can refill it.

**What the numbers actually measured.** `simulate-translation.ts` scored the
source against a hand-written `BACK_TRANSLATIONS` map of **6 entries against 36
msgids**; every string with no back-translation scored 0 similarity and was
recorded as drift, so `fail: 21` counted absences. `translate-index.ts` was
worse: it "back-translated" by applying a **40-pair word-substitution table** to
the French, then wrote the result as a `block-qa/v1` sidecar carrying an
**agent** reviewer.

Removed: `roundTripQA` from both TranslationNode manifests and from
`schemas/translation.ts` (with a comment saying why, so it is not re-added);
the `flaggedForReview`/`flagReason` pairs derived from those counts; the
`qa_translation_*` front matter on the two translated pages; the `qa` block in
`head_custom.html`; the badge in `docs-ui.js`; `qa-translation-badge.html`; and
`translate-index.ts` entirely. `simulate-translation.ts` keeps extract →
translate → inject and stops there.

`bun test` 1852 pass / 0 fail · 20 Playwright · eslint, tsc and all three
--check gates clean.
