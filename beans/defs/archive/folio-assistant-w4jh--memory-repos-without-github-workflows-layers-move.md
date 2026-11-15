---
# folio-assistant-w4jh
$schema: bean/1.0.0
title: 'Memory: Repos without .github/workflows/layers-move.yml can''t take a sandbox re-pin (Layers cache ref check times out); user script adds it (2026-11-11)'
status: completed
type: task
priority: low
created_at: 2026-11-11T16:42:21Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `layers-move-caller-gap.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Repos without .github/workflows/layers-move.yml can't take a sandbox re-pin (Layers cache ref check times out); user script adds it (2026-11-11)

2026-11-11: a re-pin pushed from a Claude sandbox leaves its layers cache on `claude/cat-layers/<key>`; only a repo's `layers-move.yml` caller (pull_request on index.lock.json → tools `layer-layers-move.yml`) moves it to `refs/cat/layers/<key>`. Without it the "checks / Layers cache ref for a re-pinned lock" job polls "(pending)" until its 5-min timeout (cancelled).

Had it: smart-immunizations, smart-trust. Missing (at 16:50Z): folio-assistant-core, smart-base, smart-trust-phw, smart-ips-pilgrimage, smart-immunizations-uganda, smart-trust-demo, smart-ra. tools has no template for the caller; copy smart-immunizations' file.

FIXED 17:50Z 11-11: I pushed the caller onto all 7 publish-on-push PR branches from the sandbox (the push of a workflow file worked; the old "threads can't push workflows" limit no longer held). The user script /mnt/project-files/publish-on-push-2026-11-11/add-layers-move.sh is now unneeded. Thread "Finish publish-on-push rollout PRs" (cmsg_017WNUkNK8kdDziPK58Pv6G9GSmgusK4K8TCWBQfu5rM7S). Related: folio-assistant-36f6, folio-assistant-rhkg.
