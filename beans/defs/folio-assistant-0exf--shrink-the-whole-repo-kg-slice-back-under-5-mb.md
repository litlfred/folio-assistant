---
# folio-assistant-0exf
$schema: bean/1.0.0
title: 'SHRINK THE WHOLE-REPO KG SLICE: it reached 8.3 MB; the budget was raised to 10 MB as a stopgap, find what grew and bring it back toward 5 MB'
status: in-progress
type: task
priority: normal
created_at: 2026-10-24T10:31:04Z
updated_at: 2026-10-24T14:15:00Z
parent: folio-assistant-whlc
---

Owner, 2026-10-24 10:28Z (CI-speed thread card, "A. Raise to 10 MB"): raise the slice budget to 10 MB now and open a bean to shrink the slice later. The whole-repo KG slice measured 8,331,264 bytes in folio-assistant#2681 against the 5 MB budget of bean q8ar. The raise is cat-harness-tools#734 (issue #733).

## Done when
- [ ] measure which node kinds and payload pointers grew since the q8ar pilots, by bytes
- [ ] cut or split the slice (e.g. move heavy kinds to their own slice) so it is back under 5 MB, or record why it should not be
- [ ] put SIZE_BUDGET_BYTES back to what the owner then decides

_2026-10-24T14:15:00Z_ — Claimed by the "Drain folio-assistant-core beans" thread (https://claude.ai/code/session_01MK9nZ3Gmon4cDBRLSURizU).
