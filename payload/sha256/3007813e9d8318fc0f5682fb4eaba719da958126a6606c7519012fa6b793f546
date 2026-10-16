---
# folio-assistant-7pvn
title: 'folio-assistant-core imports cat-harness (and cat-harness-tools) as packages, not by ../../'
status: completed
type: feature
priority: normal
created_at: 2026-10-09T15:29:13Z
updated_at: 2026-10-14T16:30:00Z
parent: folio-assistant-f6gq
---

Second layer of f6gq; needs pxtk. cat-harness needs `exports` (or deep-import-safe layout) and a pin agreeing with core's index.config.json.

## Done when
- [x] core's 228 cross-repository imports become package imports — 260 measured and rewritten in litlfred/folio-assistant-core#80; merged as core a2342ad, on cat-harness-tools#198 (f246be6, exports derived from declared code subgraphs). Downstream pins must move core past a2342ad and tools past f246be6 together (noted on folio-assistant#2529)
- [x] the pin check, as in pxtk — settled by the owner ruling: the mount pin is the pin (`mount:remote:check`); nothing further to build
- [x] core's tests: no new failure — measured in the index with #198 mounted: 791 pass / 6 fail, the same six as main; tsc 0; `check:import-direction` (now grading package specifiers) 0 from core

## Pin ruling

Owner ruling 2026-10-14 (session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs): **the mount pin IS the pin.** A layer is fetched at the exact commit `index.lock.json` pins, and `mount:remote:check` holds it to that locked tree digest, so no separate package-version pin or comparison check is needed.
