---
# folio-assistant-5hox
title: REMOVE moved QA files from main — only on the owner's explicit go, after the branch holds a hash-verified copy
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-01T08:48:11Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-7mwa
    - folio-assistant-2gst
    - folio-assistant-8wj1
---

Arc `3fva`, proposal §4 item 3.7 and decision D4. **Never on an agent's own initiative** (`deletion-requires-confirmation`).

Preconditions:
- every reader is migrated;
- the gates have been green on the branch for 7 days (D4 default);
- the `qa-reports:main/<head>` tree is byte-identical to main's `test/results` for every moved path, checked by blob hash;
- attestations stay in place (D2 default).

Report before asking: file count, bytes, and the age of the oldest file. Then wait.

## Done when
- [ ] the owner has said go, quoted here
- [ ] `git rm` is done, `.gitignore` is set, and the gates are green


## Owner ruling 2026-10-01 — D4 "Right away"
Asked as D4 with four options. The owner chose **right away** over the recommended 7-day soak. This is the explicit go: remove the moved files as soon as every reader is migrated (`oqe3`, `2ae2`, `7mwa`) and `qa-reports:main/<head>` is hash-identical for every moved path. Attestations stay (D2 (a)). The 7-day precondition above is void.



## Added by the reader audit (`gxvk`, 2026-10-01)
**Do not `git rm` before `folio-assistant-2gst` (F1) and `folio-assistant-8wj1` (F4) land.** The QA files are MIXED: 12 block/translation files hold 13 agent verdicts, and 32 `kg-qa` files hold `pair_attestations` (6 agent, 26 baseline), each beside script verdicts. Their readers re-baseline or drop those entries silently when the file is absent (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md` C4 and C11). Both are added as blockers here.
