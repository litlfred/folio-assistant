---
# folio-assistant-bx4c
$schema: bean/1.0.0
title: mount:remote re-render writes into mounted instances, breaking mount:lock:check
status: todo
type: bug
priority: normal
tags:
    - mounts
    - cat-harness-tools
created_at: 2026-11-05T08:53:21Z
updated_at: 2026-11-05T08:53:21Z
parent: folio-assistant-rwmf
---

## Evidence
On 2026-11-05 we re-pinned folio-assistant#2926 (commit e5450ee). We seeded cat-harness at its main (c632a56) and ran `bun run cat mount:remote`. That command re-renders the agent surface, and in doing so it wrote into the **mounted cat-harness instance's own files**. cat-harness is mounted whole, so those files are inside the mount. Afterwards `mount:lock:check` and `mount:remote:check` failed, because the mount no longer matched the lock.

We got round it by re-laying the mount clean (`.github/mount-from-lock.sh`) and pinning cat-harness at 351b7b0, where the committed surface was already current.

## Why it matters
The remote-mount rule says a mount is a read-only copy of a pinned commit. A writer that changes a mount makes the lock checks fail on any re-pin where the pinned layer's committed surface is stale. The failure shows up as a fixity problem rather than as "the layer's own generated files are stale". In this case those files were cat-harness's `.claude/commands/pending-show.md` and `session-intent.md`, left stale by cat-harness#1030.

## Fix (proposed)
In cat-harness-tools' `mount:remote` / agent-surface renderer:
- never write inside a mounted instance's directory;
- render only the index's own surface;
- when a mounted layer's committed surface is stale, report it as that layer's finding instead of rewriting it.

## Done when
- [ ] `mount:remote` writes nothing under any mounted instance's directory (test: the lock digests are unchanged after `mount:remote`)
- [ ] a stale committed surface in a mounted layer is reported, naming the layer, not silently rewritten

_2026-11-05_ — Filed at the owner's request ("yes file the bean") by https://claude.ai/code/session_01XueePufkpx8fwJxavyDS5h, from the #2926 re-pin.
