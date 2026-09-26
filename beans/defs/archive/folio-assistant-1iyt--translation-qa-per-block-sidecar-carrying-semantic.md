---
# folio-assistant-1iyt
title: 'Translation QA: per-block sidecar carrying semantic-roundtrip witnesses'
status: completed
type: task
priority: normal
created_at: 2026-09-18T19:46:50Z
updated_at: 2026-09-18T20:23:29Z
---

There is no per-block translation QA data today. roundTripQA lives on TranslationNode (schemas/translation.ts) at page/node granularity and carries only pass/warn/fail/total/method — no reviewer identity, no timestamp, no hash, so no witness list and nothing per block for an icon to open. translation-qa-sweep.ts works at PAGE granularity (PageTranslationStatus).

Needed for the translation half of the drill-down: per-block sidecar entries in the block-qa/v1 shape so one renderer serves both families. Related: ktt2 (round-trip back-translation), t8g3 (#206 foundation).
