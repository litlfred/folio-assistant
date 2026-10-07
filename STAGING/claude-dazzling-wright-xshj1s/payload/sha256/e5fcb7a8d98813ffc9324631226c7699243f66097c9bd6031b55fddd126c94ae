---
# folio-assistant-437w
title: 'kg:subscribe refuses a fork whose declaration is one level down (smart-base, smart-trust, smart-immunizations): accept an upstreamPath'
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T19:43:32Z
updated_at: 2026-10-06T19:43:44Z
parent: folio-assistant-fnx4
---

## Why

The owner ruled 2026-10-06 that smart-trust, smart-base and smart-immunizations leave folio-assistant the way who-iris did: each fork is authoritative and folio-assistant keeps a REMOTE subscription to it via `kg:subscribe`, pinned, no submodules. Today `bun run kg:subscribe` refuses all three with `not-a-substrate: the root carries no Knowledge Graph declaration`, because each fork nests its declaration one level down (`smart-base/smart-trust.json`, `smart-base/smart-immunizations.json`, `smart-base/smart-base.json`) and the directory name is not always the instance name. Blocks cutover PR #2320. Companion to PR #2326 (remote mounts), which names the same field `upstreamPath`.

## Done when

- [ ] `kg:subscribe` takes `--upstream-path <dir>` and looks for the declaration in that directory only.
- [ ] Without the flag, a missing root declaration falls back to exactly-one `<dir>/<name>.json` one level down whose `name` agrees (and equals `--name` when given); two or more candidates are refused by name, never guessed.
- [ ] The subscription entry records `upstreamPath`, the snapshot records the nested `file`, and `kg:subscribe:check` holds the two to the same subtree.
- [ ] Three states preserved: substrate / not-a-substrate(reason) / could-not-determine(reason).
- [ ] Tests over fixture bare repos: root, nested with dir != name, ambiguous, none; the nested case shown failing on the old code.
- [ ] PR open to main, linked to #2320 and #2326.

Claimed by session https://claude.ai/code/session_01EcBv3uwKYcnNbCC6BcPG92 on branch claude/kg-subscribe-upstream-path.
