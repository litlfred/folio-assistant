---
# folio-assistant-jstq
$schema: bean/1.0.0
title: Fresh containers start with instance mounts older than index.lock.json, and mount-from-lock never refreshes them
status: in-progress
type: bug
priority: normal
created_at: 2026-11-05T13:27:15Z
updated_at: 2026-11-05T15:19:33Z
parent: folio-assistant-4j43
---

Measured 2026-11-05 (session of bean x38u): in a fresh folio-assistant container, `mount:lock --check` reports 10 of 12 instances 'missing — no longer hash to the lock' (all but bootstrap, bootstrap-tools). The SessionStart hook's `.github/mount-from-lock.sh` leaves each untouched ('edits there are somebody's work'), with output sent to /dev/null, so nobody sees it. The stale cat-harness-tools on disk then cannot parse index.config.json (Unrecognized key enableSubgraphs), so state:mount's remote fan-out is could-not-determine too. Consequence seen: x38u (.gitignore block). Likely: the container image caches the checkout's mounts from an older lock. Needs: a way to tell a pristine older-pin tree from local edits (e.g. hash against the previous lock entry / a recorded mount marker) so it can be replaced, and a hook that does not swallow the MISSING verdict.

## Done when
- [ ] a fresh container's mounts match index.lock.json after the session-start hook, or the hook says loudly that they do not

## Progress 2026-11-05
- [x] mount-from-lock replaces a mount at an earlier pin of the lock (priorPins); edited mounts still refused — cat-harness-tools#1531
- [ ] #1531 merged
- [ ] SessionStart hook in folio-assistant stops discarding mount-from-lock output (separate change, owner's call)
