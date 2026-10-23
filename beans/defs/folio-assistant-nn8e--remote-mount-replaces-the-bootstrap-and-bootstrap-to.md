---
# folio-assistant-nn8e
$schema: bean/1.0.0
title: Remote mount replaces the bootstrap and bootstrap-tools submodules (MVP), issue 2462
status: in-progress
type: task
priority: high
created_at: 2026-10-07T20:07:21Z
updated_at: 2026-10-23T08:31:00Z
parent: folio-assistant-0mpw
---

Issue #2462. Owner 2026-10-07: URGENT, MVP, fix the mount tool first; pins trusted at bootstrap@12a5c9eadca3 and bootstrap-tools@1947e0536a97. Plan and blockers B1-B3 in the issue.

## Done when
- [x] Tool PR: whole-instance mount, mounter free of bootstrap-tools imports, lock mounts treated like submodules by git-corpus / instance-repositories / readme-sections, closure follows an upstream lock
- [x] mount-deps composite action (delivered via `.github/mount-from-lock.sh`, enforced across all workflows by `check:workflow-submodules`)
- [x] Atomic cutover PR: remoteMounts + consent, gitlinks + .gitmodules removed, lock committed, 33 workflows repointed, check:workflow-submodules inverted
- [x] Fresh clone without --recurse + state:mount equals the submodule tree
- [ ] Follow-up beans: `init-folio --link remote` and `REFERENCE_PACKAGES` (tracked on parent `0mpw`); remote BRANCH mount of other repos' named subgraphs, hydrated vs not (tracked on `mo75`)


## Holder
Claimed 2026-10-07 by session_012qoycyCSGidZqW245vXhze on branch claude/dazzling-wright-xshj1s. Child of 0mpw (remote mount).


## Progress 2026-10-07
- [x] Tool PR #2463 merged (da897f8): whole-instance mount, mount-from-lock.ts, corpus/README/instance readers.
- [x] Cutover: remoteMounts + lock, gitlinks and .gitmodules removed, .gitignore, 32 workflows repointed (29 mount steps; publish.yml replays the platform lock inside a folio), merge-guard/merge-main handle either side, check:workflow-submodules requires the replay, session start replays first.
- [x] Proven: replay from GitHub into an empty dir is byte-identical to the submodule checkout; mount:remote:check OK.
- [ ] Aftermath: follow-up items (`init-folio --link remote`, `REFERENCE_PACKAGES`) tracked on parent `0mpw` and `mo75`.

## State 2026-10-09 (evidence append; completed 2026-10-22)
Ticked on the holder's own 2026-10-07 progress and re-checked: Tool PR #2463 and cutover #2470 are merged; main has no `.gitmodules`; the replay is `.github/mount-from-lock.sh` (enforced by `check:workflow-submodules`), and the whole index (11 instances, not only bootstrap) now mounts this way (`index.lock.json`). Follow-up items (`init-folio --link remote` and `REFERENCE_PACKAGES`) are tracked on parent `0mpw`, and named subgraph branch mounts (`hydrated vs not`) are tracked on `mo75`. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
