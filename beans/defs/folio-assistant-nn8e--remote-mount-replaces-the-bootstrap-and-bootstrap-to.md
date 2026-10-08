---
# folio-assistant-nn8e
title: Remote mount replaces the bootstrap and bootstrap-tools submodules (MVP), issue 2462
status: in-progress
type: task
priority: high
created_at: 2026-10-07T20:07:21Z
updated_at: 2026-10-07T20:27:18Z
parent: folio-assistant-0mpw
---

Issue #2462. Owner 2026-10-07: URGENT, MVP, fix the mount tool first; pins trusted at bootstrap@12a5c9eadca3 and bootstrap-tools@1947e0536a97. Plan and blockers B1-B3 in the issue.

## Done when
- [ ] Tool PR: whole-instance mount, mounter free of bootstrap-tools imports, lock mounts treated like submodules by git-corpus / instance-repositories / readme-sections, closure follows an upstream lock
- [ ] mount-deps composite action
- [ ] Atomic cutover PR: remoteMounts + consent, gitlinks + .gitmodules removed, lock committed, 33 workflows repointed, check:workflow-submodules inverted
- [ ] Fresh clone without --recurse + state:mount equals the submodule tree
- [ ] Follow-up beans: init-folio --link remote; REFERENCE_PACKAGES; remote BRANCH mount of other repos' named subgraphs, hydrated vs not


## Holder
Claimed 2026-10-07 by session_012qoycyCSGidZqW245vXhze on branch claude/dazzling-wright-xshj1s. Child of 0mpw (remote mount).


## Progress 2026-10-07
- [x] Tool PR #2463 merged (da897f8): whole-instance mount, mount-from-lock.ts, corpus/README/instance readers.
- [x] Cutover: remoteMounts + lock, gitlinks and .gitmodules removed, .gitignore, 32 workflows repointed (29 mount steps; publish.yml replays the platform lock inside a folio), merge-guard/merge-main handle either side, check:workflow-submodules requires the replay, session start replays first.
- [x] Proven: replay from GitHub into an empty dir is byte-identical to the submodule checkout; mount:remote:check OK.
- [ ] Aftermath: 32 code references to .gitmodules/git submodule (verify-clone, init-folio, instance-roots...); init-folio --link remote; REFERENCE_PACKAGES.
