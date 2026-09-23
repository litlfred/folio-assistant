---
# folio-assistant-kcvt
title: 'human-translation-workflow Gateway_Drift: both branches go to Task_SMEReview'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T16:26:05Z
updated_at: 2026-09-23T16:45:20Z
parent: folio-assistant-1swy
---

processes/human-translation-workflow.bpmn: Gateway_Drift ('Drift detected?') has F15 'Drift found' and F16 'Clean', and both target Task_SMEReview. The decision changes nothing, so either the gateway is redundant or one branch goes to the wrong step (e.g. Clean should skip SME review or go to a lighter step).

Found by the gateway documentation criteria (#1051, bean 6hq4), left open when issue #1044 closed.

## Done when
- [x] decide the intended routing — settled by the sources: translation-manager says "route drift to a human reviewer", bean ktt2 says which reading is right "is a human call", and the diagram's own lane documentation says a clean round-trip is "evidence for the reviewer, never a bypass of them". Both branches reaching Task_SMEReview was correct; the gateway was redundant
- [x] gateway removed; F14 (`findings attached`) goes straight to Task_SMEReview, and Task_RoundTripQA's documentation says why no gateway follows
- [x] regenerate render:bpmn / processes:viz / kg:audit; gates green

## Summary of Changes

Fixed in PR #1116 — see the checked items above for what changed and why.
