---
# folio-assistant-0exf
$schema: bean/1.0.0
title: 'SHRINK THE WHOLE-REPO KG SLICE: it reached 8.3 MB; the budget was raised to 10 MB as a stopgap, find what grew and bring it back toward 5 MB'
status: completed
type: task
priority: normal
created_at: 2026-10-24T10:31:04Z
updated_at: 2026-10-29T09:18:00Z
parent: folio-assistant-whlc
---

Owner, 2026-10-24 10:28Z (CI-speed thread card, "A. Raise to 10 MB"): raise the slice budget to 10 MB now and open a bean to shrink the slice later. The whole-repo KG slice measured 8,331,264 bytes in folio-assistant#2681 against the 5 MB budget of bean q8ar. The raise is cat-harness-tools#734 (issue #733).

## Done when

- [x] measure which node kinds and payload pointers grew since the q8ar pilots, by bytes
- [x] cut or split the slice (e.g. move heavy kinds to their own slice) so it is back under 5 MB, or record why it should not be (cat-harness-tools#756)
- [x] put SIZE_BUDGET_BYTES back to what the owner then decides (6 MB, cat-harness-tools#816, df0a333)

_2026-10-24T14:15:00Z_ — Claimed by the "Drain folio-assistant-core beans" thread (https://claude.ai/code/session_01MK9nZ3Gmon4cDBRLSURizU).

## 2026-10-24 — measured, and the fix is up (cat-harness-tools#756)

| index | nodes | edges | bytes |
|---|---|---|---|
| folio-assistant main (pins before the #603 move) | 4,065 | 16,671 | 4,472,832 |
| folio-assistant#2681 at 2dbc116 | 8,217 | 25,218 | 8,323,072 |
| same, with #756 | 4,134 | 17,052 | 4,587,520 |

The growth was 4,083 one-release tombstones (`migrationTombstones`: each subject's pre-#603 `#fragment`, no `@type`, only `deprecated`/`isReplacedBy`/`sameAs`). #756 leaves them out of the search slice; the published document keeps them. Box 3 (the budget) is the owner's call, asked in the "Drain folio-assistant-core beans" thread.

_2026-10-24T15:00:00Z_ — cat-harness-tools#756 merged (120ab6d). The slice is back under 5 MB once the index pins tools at or after it. Box 3 waits on the owner's budget answer (card in the drain thread).

_2026-10-29T07:55:00Z_ — Claimed by Lane E (https://claude.ai/code/session_01Qmmkt6hTCZSkeyx315exLo). Box 3 re-asked of the owner there.

_2026-10-29T09:18:00Z_ (drain lane E, https://claude.ai/code/session_01Qmmkt6hTCZSkeyx315exLo). Owner chose "B. 6 MB" (card, 09:15Z). cat-harness-tools#816 merged as df0a333. Closed.

## Merged from the cat-harness copy (bean dedupe, 2026-10-30)

These lines differed from the kept copy and could not be merged automatically (cat-harness-tools#459). They are kept here so nothing is lost.

Where: ## Done when

```text
- [ ] measure which node kinds and payload pointers grew since the q8ar pilots, by bytes
- [ ] cut or split the slice (e.g. move heavy kinds to their own slice) so it is back under 5 MB, or record why it should not be
- [ ] put SIZE_BUDGET_BYTES back to what the owner then decides
```
