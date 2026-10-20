---
# folio-assistant-pxtk
$schema: bean/1.0.0
title: 'cat-harness imports bootstrap-tools as a package (@litlfred/bootstrap-tools), not by ../../'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T15:29:13Z
updated_at: 2026-10-14T16:00:00Z
parent: folio-assistant-f6gq
---

First layer of f6gq: bootstrap-tools has no climbs of its own, so it is the bottom.

## Done when
- [x] cat-harness depends on @litlfred/bootstrap-tools at the SAME commit its index.config.json mounts, and a check fails when the two pins differ (one version, two delivery routes) — settled by the owner ruling: there is one route, the mount, and `mount:remote:check` fails when the tree differs from the lock
- [x] the 40 imports of ../../bootstrap-tools/ become @litlfred/bootstrap-tools/ — cat-harness main `45aee82c`: no `../bootstrap-tools/` import remains in any .ts/.js; 12 use `@litlfred/bootstrap-tools/…` (e.g. `schemas/vocabulary.ts:40`); package.json declares the dependency and workspaces
- [x] cat-harness's tests: no new failure against main — nothing left to change, so no new failure by construction

## Pin ruling

Owner ruling 2026-10-14 (session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs): **the mount pin IS the pin.** A layer is fetched at the exact commit `index.lock.json` pins, and `mount:remote:check` holds it to that locked tree digest, so no separate package-version pin or comparison check is needed.

## Summary of Changes

Found already done during the 2026-10-14 bean drain (session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs): cat-harness reached its own repository (merge #137, 2026-10-11) with the bootstrap-tools imports already by package name. With the owner's pin ruling (the mount pin is the pin), every box is met.
