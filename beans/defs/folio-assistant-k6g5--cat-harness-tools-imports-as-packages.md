---
# folio-assistant-k6g5
title: 'cat-harness-tools imports cat-harness and bootstrap-tools as packages, not by ../../'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T15:29:13Z
updated_at: 2026-10-14T15:45:00Z
parent: folio-assistant-f6gq
---

Layer of f6gq beside core; needs pxtk. The largest: ~740 imports in 286 files.

## Done when
- [x] the imports become package imports — cat-harness-tools `b61b9fd`: 1,048 specifiers rewritten to `@litlfred/cat-harness/…` / `@litlfred/bootstrap-tools/…`; the only `../` left is a generated string (`adapters/mcp-server/server.ts:130`)
- [x] the pin check — satisfied by the owner ruling below: the mount pin is the pin (`mount:remote:check`)
- [x] tests: no new failure — `b61b9fd` reports the same failure set before and after

## Summary of Changes

Imports moved to package names in cat-harness-tools `b61b9fd` with no new test failure. Owner ruling 2026-10-14 (session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs): **the mount pin IS the pin.** A layer is fetched at the exact commit `index.lock.json` pins, and `mount:remote:check` holds it to that locked tree digest, so no separate package-version pin or comparison check is needed.
