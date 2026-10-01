---
# folio-assistant-5hox
title: REMOVE moved QA files from main — only on the owner's explicit go, after the branch holds a hash-verified copy
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-01T08:15:46Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-7mwa
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
