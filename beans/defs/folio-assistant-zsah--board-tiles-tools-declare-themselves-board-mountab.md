---
# folio-assistant-zsah
title: 'BOARD TILES: tools declare themselves board-mountable, and a tile opens the EXISTING visualisation'
status: todo
type: task
priority: normal
created_at: 2026-09-20T21:47:28Z
updated_at: 2026-09-20T21:47:28Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — R12 + R16, and it is mostly a REUSE constraint. Unit 9 of 10.

**CRDM Q8, answered:** *"3 + default wtih sticky and fsh guts and tile(s) for KG
viewer(s) and docs"* — so tiles come from the **Tool registry** (a tool declares
itself board-mountable), **plus a default set** every board carries: new sticky,
fsh-guts, KG viewer(s), docs.

And then, immediately after: **"those should open their exisiting visualzaiton"**.
That is the whole shape of this unit. A KG-viewer tile MOUNTS `scripts/kg-viewer.ts`;
a docs tile opens the docs rendering. **Nothing here builds a second viewer.**

**Check before building**, because three of these already have beans and two are
in flight:

| | |
|---|---|
| `1le7` | Action-icon tiles — one QR-sized tile template for settings / languages / KG viewer. **This is the tile template; do not mint a second one.** |
| `7vhe` | fsh-guts viewer, dead fish icon + counter + select dialog |
| `xgd8`, `jbx2`, `v1hw` | the per-graph visualisers a tile would open |

## Done when

- [ ] a tool declares itself board-mountable; the board discovers tiles rather than hardcoding them
- [ ] the default set is present on every board: new sticky, fsh-guts, KG viewer(s), docs
- [ ] each tile opens the EXISTING visualisation — asserted by reuse, not by screenshot
- [ ] the tile template is `1le7`'s, extended if it needs to be, never duplicated
