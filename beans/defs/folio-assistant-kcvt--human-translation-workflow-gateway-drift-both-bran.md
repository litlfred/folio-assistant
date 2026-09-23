---
# folio-assistant-kcvt
title: 'human-translation-workflow Gateway_Drift: both branches go to Task_SMEReview'
status: todo
type: bug
created_at: 2026-09-23T16:26:05Z
updated_at: 2026-09-23T16:26:05Z
---

processes/human-translation-workflow.bpmn: Gateway_Drift ('Drift detected?') has F15 'Drift found' and F16 'Clean', and both target Task_SMEReview. The decision changes nothing, so either the gateway is redundant or one branch goes to the wrong step (e.g. Clean should skip SME review or go to a lighter step).

Found by the gateway documentation criteria (#1051, bean 6hq4), left open when issue #1044 closed.

## Done when
- [ ] decide the intended routing from the translation skill(s) and round-trip QA docs; ask the owner if they do not settle it
- [ ] fix the flow (or remove the gateway), give it documentation
- [ ] regenerate render:bpmn / processes:viz / kg:audit; gates green
