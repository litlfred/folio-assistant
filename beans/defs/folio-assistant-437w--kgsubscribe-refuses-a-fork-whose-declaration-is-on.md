---
# folio-assistant-437w
title: 'kg:subscribe refuses a fork whose declaration is one level down (smart-base, smart-trust, smart-immunizations): accept an upstreamPath'
status: complete
type: task
priority: normal
created_at: 2026-10-06T19:43:32Z
updated_at: 2026-10-08T04:30:00Z
parent: folio-assistant-fnx4
---

## Why

The owner ruled 2026-10-06 that smart-trust, smart-base and smart-immunizations leave folio-assistant the way who-iris did: each fork is authoritative and folio-assistant keeps a REMOTE subscription to it via `kg:subscribe`, pinned, no submodules. Today `bun run cat kg:subscribe` refuses all three with `not-a-substrate: the root carries no Knowledge Graph declaration`, because each fork nests its declaration one level down (`smart-base/smart-trust.json`, `smart-base/smart-immunizations.json`, `smart-base/smart-base.json`) and the directory name is not always the instance name. Blocks cutover PR #2320. Companion to PR #2326 (remote mounts), which names the same field `upstreamPath`.

## Done when

- [x] `kg:subscribe` takes `--upstream-path <dir>` and looks for the declaration in that directory only.
- [x] Without the flag, a missing root declaration falls back to exactly-one `<dir>/<name>.json` one level down whose `name` agrees (and equals `--name` when given); two or more candidates are refused by name, never guessed.
- [x] The subscription entry records `upstreamPath`, the snapshot records the nested `file`, and `kg:subscribe:check` holds the two to the same subtree.
- [x] Three states preserved: substrate / not-a-substrate(reason) / could-not-determine(reason).
- [x] Tests over fixture bare repos: root, nested with dir != name, ambiguous, none; the nested case shown failing on the old code.
- [x] PR open to main, linked to #2320 and #2326.

## Completed on landed evidence
Landed on main in commit 228884319873 ("kg:subscribe: find a declaration one level down, and record its upstreamPath (437w)").
- Added `--upstream-path <dir>` to `kg-subscribe.ts`.
- Recorded `upstreamPath` in `SubstrateSubscriptionEntrySchema` and nested path in snapshot `file`.
- Implemented nested declaration fallback with ambiguity check.
- Added 203 lines of unit tests in `kg-subscribe.test.ts`.
- Regenerated artifacts and verified on main.
