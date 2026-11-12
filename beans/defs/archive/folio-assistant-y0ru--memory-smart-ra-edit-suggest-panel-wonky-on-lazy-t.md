---
# folio-assistant-y0ru
$schema: bean/1.0.0
title: 'Memory: smart-ra edit/suggest panel wonky on lazy themed page: core scopeCss bug (core#612, held for freeze) + stale smart-ra pins lacking 🔗 anchors'
status: completed
type: task
priority: low
created_at: 2026-11-02T13:25:54Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-block-panel-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-ra edit/suggest panel wonky on lazy themed page: core scopeCss bug (core#612, held for freeze) + stale smart-ra pins lacking 🔗 anchors

Thread "Fix smart-ra edit and suggest panel" (cmsg_017WNUkNK8kdDziPK58Pv6G9CfR3dCkpEywQvvyu4GcPA6), 2026-11-02.
- Cause 1: smart-ra pins (cat-harness 676c507, tools fd94827, 11-01 ~21:00Z) predate the 🔗 anchor work; smart-ra#228 (cascade round 2, red) also predates it. Last publish 08:51Z.
- Cause 2 (bug): core scripts/scope-css.ts turned `html.fa-bp .x` into `.fa-doc html.fa-bp .x` (dead) and scoped `.fa-block-panel` (panel lives on body). Only the themed lazy `index.html` is affected; `index.hydrated.html` is standalone. Fix: folio-assistant-core#612 (issue #611, branch claude/themed-block-panel-css), draft, HELD unmerged for the 13:16Z lower-layer code freeze.
- Card Q-RA-PANEL-1 ANSWERED A (user tap 14:38Z 11-02): wait for freeze to lift, then merge core#612 and do ONE smart-ra re-pin (refresh #228 to train pins incl. core#612) + publish.
- Asked re-pin train thread whether smart-ra is on the train.
- Local repro: sparse gh-pages checkout (assets/, en/dpi-h-ra/, dpi-h-ra/blocks/, cat-harness*/) served under /smart-ra/ path; core tests need matching pins (document-layout tests fail on content-context prefix locally at baseline too).
Related: folio-assistant-decn, folio-assistant-ufn8.
- 17:55Z core#612 merged (04784f3). Cascade thread pushed smart-ra#228 round 6 (8d572a1) incl core#612 + cat-harness#979; it owns #228, don't push there.
- 18:0xZ user recording: 2nd bug = splitBlocks left `<div class="fa-numbered">` opener in lazy shell -> rest of doc nested, 66% caption width puts icons mid-page. Fix + right-gutter icons (THEMED_STYLE) = core#616 (issue #615), merge on green.
- User asked single small icon per block opening one panel. Mockups /mnt/project-files/smart-ra-panel-2026-11-02/; card Q-RA-ICON-1 (cmsg_017WNUkNK8kdDziPK58Pv6G9JCYQB5Dk5LW93Lcb661Z7f): A faint ⋮ + count (rec) / B hover ⊕ / C margin bar. Build lands in tools edit-links runtime + cat-harness asset regen.
- 18:11Z owner OK'd single faint 📣 trigger (Q-RA-ICON-2 A) + "less padding RHS" (gutter 1.5rem in core#616) + "then merge"; 🔗 in gutter above 📣, grey until hover. tools#1411 + cat-harness#981 (asset regen), merge together on green.
- Comments-in-panel mockups posted; card Q-RA-PC-1 (cmsg_017WNUkNK8kdDziPK58Pv6G93bcV5eKGwSXyeX2h3KqaJy): A chips+show more / B by change set (rec) / C search. Build goes in core scripts/public-comment-site.ts comments pane render.
- 18:16-18:33Z owner: no right gutter; 📣 in LEFT gutter; one anchor = theme's heading 🔗, grey, lit on heading OR section hover; panel comments = block's PCs only + filter chips + Show more (core#620, issue #619). Handover bean folio-assistant-sbpn (fa branch cat/cat-harness/beans). Bookmark/pin-any-graph-kind idea sent to coordinator for own thread.
- 19:13Z: merged core#616, core#620, cat-harness#981. Open: tools#1411 (c0b3191, +left padding per owner on dth-pc) + cat-harness#994 (asset regen). Then re-pin smart-ra + republish. dth-pc flattened-table duplicates handed to coordinator.
