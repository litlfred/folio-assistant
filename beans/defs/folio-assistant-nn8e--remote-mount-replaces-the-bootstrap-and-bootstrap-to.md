---
# folio-assistant-nn8e
$schema: bean/1.0.0
title: Remote mount replaces the bootstrap and bootstrap-tools submodules (MVP), issue 2462
status: in-progress
type: task
priority: high
created_at: 2026-10-07T20:07:21Z
updated_at: 2026-10-09T17:43:31Z
parent: folio-assistant-0mpw
---

Issue #2462. Owner 2026-10-07: URGENT, MVP, fix the mount tool first; pins trusted at bootstrap@12a5c9eadca3 and bootstrap-tools@1947e0536a97. Plan and blockers B1-B3 in the issue.

## Done when
- [x] Tool PR: whole-instance mount, mounter free of bootstrap-tools imports, lock mounts treated like submodules by git-corpus / instance-repositories / readme-sections, closure follows an upstream lock
- [ ] mount-deps composite action
- [x] Atomic cutover PR: remoteMounts + consent, gitlinks + .gitmodules removed, lock committed, 33 workflows repointed, check:workflow-submodules inverted
- [x] Fresh clone without --recurse + state:mount equals the submodule tree
- [ ] Follow-up beans: init-folio --link remote; REFERENCE_PACKAGES; remote BRANCH mount of other repos' named subgraphs, hydrated vs not


## Holder
Claimed 2026-10-07 by session_012qoycyCSGidZqW245vXhze on branch claude/dazzling-wright-xshj1s. Child of 0mpw (remote mount).


## Progress 2026-10-07
- [x] Tool PR #2463 merged (da897f8): whole-instance mount, mount-from-lock.ts, corpus/README/instance readers.
- [x] Cutover: remoteMounts + lock, gitlinks and .gitmodules removed, .gitignore, 32 workflows repointed (29 mount steps; publish.yml replays the platform lock inside a folio), merge-guard/merge-main handle either side, check:workflow-submodules requires the replay, session start replays first.
- [x] Proven: replay from GitHub into an empty dir is byte-identical to the submodule checkout; mount:remote:check OK.
- [ ] Aftermath: 32 code references to .gitmodules/git submodule (verify-clone, init-folio, instance-roots...); init-folio --link remote; REFERENCE_PACKAGES.

## State 2026-10-09 (evidence append; holder session_012qoycyCSGidZqW245vXhze's claim left in place)
Ticked on the holder's own 2026-10-07 progress and re-checked: Tool PR #2463 and cutover #2470 are merged; main has no `.gitmodules`; the replay is `.github/mount-from-lock.sh`, used by 14 of 34 workflows (2 still say `submodules: true|recursive`), and the whole index (11 instances, not only bootstrap) now mounts this way (`index.lock.json`).
Still open:
- **mount-deps composite action** — none exists (`.github/actions/` holds only `lake-cache-restore`); the shell script took its place. Either accept `mount-from-lock.sh` as that box or build the action.
- **Aftermath** — 18 `.ts` files across cat-harness / cat-harness-tools / bootstrap-tools still mention `.gitmodules` or `git submodule` (grep, 2026-10-09; some may be intentional history).
- **Follow-ups** — `init-folio --link` accepts only `submodule | sibling` (no `remote`; `init-folio.ts:1978`), and `skill-fetch`'s `REFERENCE_PACKAGES` is still pinned to `ref: "main"`. No follow-up beans found for either; both are also on `0mpw`'s list. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
