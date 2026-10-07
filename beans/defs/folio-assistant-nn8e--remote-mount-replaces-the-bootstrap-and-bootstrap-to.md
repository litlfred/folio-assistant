---
# folio-assistant-nn8e
title: Remote mount replaces the bootstrap and bootstrap-tools submodules (MVP), issue 2462
status: in-progress
type: feature
priority: high
created_at: 2026-10-07T20:07:21Z
updated_at: 2026-10-07T20:07:44Z
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
