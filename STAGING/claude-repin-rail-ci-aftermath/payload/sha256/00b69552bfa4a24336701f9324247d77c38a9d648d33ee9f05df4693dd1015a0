---
# folio-assistant-g3h7
$schema: bean/1.0.0
title: 'MAIN RED: external-schema registry lists opengroup-archimate-3.0 but no instance declares a use of it; the committed external-schemas page has 26 rows for 27 specs'
status: in-progress
type: bug
priority: high
created_at: 2026-10-10T16:55:29Z
updated_at: 2026-10-10T17:21:07Z
parent: folio-assistant-ml9h
---

Found on folio-assistant#2531, 2026-10-10. cat-harness-tools/test/coordinator/external-schemas-viz-checkout.test.ts fails 2 tests at main's own pins (cat-harness a89998b, cat-harness-tools a9e699c) — reproduced locally with main's index.lock, so every folio-assistant PR's bun test shard 3 is red.

- 'every specification has a declared user': undeclared = [opengroup-archimate-3.0]
- 'every row's link resolves': committed page has 26 links, registry has 27 specs

## Done when
- [ ] the instance that uses ArchiMate (cat-harness-tools carries archimate/) declares the use in one of the four forms (front-matter, kind, tag, xmlns)
- [ ] the committed external-schemas page is regenerated in cat-harness (gen-external-schemas-viz)
- [ ] both re-pinned in folio-assistant; shard 3 green on main

## Claimed (2026-10-10)

Owner chose option 1: lane A fixes it (declaration + cat-harness page regen), then hands the SHAs to #2529 for the re-pin.

## Progress

litlfred/cat-harness#110 adds `@conformsTo opengroup-archimate-3.0` to archimate/schemas/archimate.ts. Verified at the index pins: the checkout test goes 6/2 → 8/0 once the page is regenerated. Main's cat-harness renders that page standalone now, so the regenerated checkout page lands with folio-assistant#2529's re-pin.

## Progress

cat-harness#110 merged (7c0ce78); owner confirmed the merge (cat-harness has no PR CI; verified locally in the index). Remaining: folio-assistant#2529 pins cat-harness at or after 7c0ce78 and regenerates the checkout external-schemas page (session_017QXvm7c7RDYFguWzSxhrMb). Close when shard 3 is green on main.

## Status (17:16 UTC)

In folio-assistant#2529 at 8cf8ee3: cat-harness pinned 96bf374 (includes #110 and #112, the regenerated external-schemas page; checkout test 8/8 locally), folio-assistant-sci pinned c6a07d2. Close when #2529 merges green.
