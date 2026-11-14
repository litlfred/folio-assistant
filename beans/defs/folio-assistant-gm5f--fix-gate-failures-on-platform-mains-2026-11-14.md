---
# folio-assistant-gm5f
$schema: bean/1.0.0
title: 'Fix gate failures on platform mains (2026-11-14): five new gates on smart-immunizations#145'
status: in-progress
type: task
priority: high
created_at: 2026-11-14T17:50:00Z
updated_at: 2026-11-14T17:50:00Z
tags:
    - ci
    - red-main
    - handover
---

Thread "Fix gate failures on platform mains" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9BNSixgF4DaasKpgTGfx9vA), dispatched by the merge manager on red-main duty. Triage: smart-immunizations#145. Rule: fix causes, never waive a gate. Green PRs go to the merge manager; it merges once the owner reopens the merge window.

Root cause of three of the five: folio-assistant-core ef86a4e5 (2026-11-13) moved editing-hci-validation.bpmn and draft-to-publication.bpmn into its opt-in collab/ group, and a root that leaves an opt-in group off does not get it mounted. Gates that read those files from disk then fail in IG roots. smart-immunizations enables no opt-in groups (its #139 would).

| # | Gate | Cause | PR |
|---|------|-------|----|
| 1 | check:bun-pin | layer-pr-checks.yml compare step without bun-version | cat-harness-tools#2184 (another session) |
| 2 | check:content-code-free | cat-harness site-chrome/tests/*.test.ts | tools#2199 adds the tests, then cat-harness#1341 deletes them (issue tools#2198). tools#2185 exempts the folder instead (a waiver); close it if #2199 lands |
| 3 | check:corpus-gate | diagram loaded before checking for blocks | tools#2195 (issue #2194) |
| 4 | check/graph:declaration-resolution | smart-base L2-collab/L3-collab declared inside unmounted L2/, L3/ | tools#2197 (issue #2196): "not judged here" for a mounted layer's own ids when its opt-in dirs are absent |
| 5 | check:workflow-refs | smart-base dak profile names core's opt-in diagram | smart-base#410 (issue #409) |

Repro: clone smart-immunizations at the PR head, `.github/mount-from-lock.sh`, `bun install`, `bun run cat <gate>`.

_2026-11-14T17:50:00Z_ — Filed. All PRs draft; reproduced 3, 4, 5 locally and verified each fix on #145's mounts.
