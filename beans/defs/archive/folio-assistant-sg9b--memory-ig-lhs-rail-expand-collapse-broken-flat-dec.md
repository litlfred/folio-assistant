---
# folio-assistant-sg9b
$schema: bean/1.0.0
title: 'Memory: IG LHS rail expand/collapse broken (flat declared menu, dead ▸); fix tools#1777 + cat-harness#1201 (issue tools#1776)'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `rail-fold-declared-menu-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: IG LHS rail expand/collapse broken (flat declared menu, dead ▸); fix tools#1777 + cat-harness#1201 (issue tools#1776)

Thread "Fix navbar expand and collapse" (cmsg_017WNUkNK8kdDziPK58Pv6G9Uq91sTds9G2jUcijzQhagX), user 19:25Z 2026-11-10, on smart-html-jtd/immunizations.
- Cause: cat-harness-tools scripts/lib/navbar.ts `visualiserNavOf` flattened the IG's declared `data-fa-visualiser-nav` menu (group = dead row with ▸ glyph, kids = depth:1 siblings). Not related to the thin-page loader.
- Fix: nest kids as `children` + `fold` (existing fa-nav-twisty); `renderRailRegions` marks current in shared documentIndex so its group opens. cat-harness navbar.js regenerated (`bun scripts/gen-navbar-assets.ts` writes to sibling ../cat-harness).
- Draft PRs tools#1777 + cat-harness#1201, merge together; live on IG sites after re-pin + rebuild. Subscribed.
- Local test: git archive gh-pages immunizations/ + python http.server; /home/user/node_modules symlink to tools node_modules needed for bun test.
- 19:33Z overlap: tools#1779 + cat-harness#1202 (landing thread) also touch harness-rail.ts / navbar.js. Whichever pair merges second: merge main, re-run navbar:assets.
- 19:37Z both PRs green + clean, still draft (ready_for_review refused by safety check). Card Q-NAV-1 (msg cmsg_017WNUkNK8kdDziPK58Pv6G9DoWTNju7VqJG7knhTeWYrs): A merge now (rec) / B merge manager / C wait for #1779 pair.
- 19:37Z coordinator: green code-only PRs fall under user's standing 'merge what's green'; handed both to merge manager. Card withdrawn.
- 19:52Z owner typed A (merge pair now). tools#1779 already merged -> merged main into #1777 (61b675a), regenerated navbar.js on #1201 (7ef197d, includes #1779 client change, supersedes cat-harness#1202). Merge both when CI green.
- 20:00Z tools#1777 + cat-harness#1201 MERGED (cat-harness 67b7ad0). cat-harness#1202 superseded (told coordinator).
- 20:45Z owner: too much LHS spacing + long labels truncated; Foundations/Publications on jtd landing don't collapse. Landing builds its own flat rail (smart-html-jtd scripts/landing.py rail_data) -> issue smart-html-jtd#17, draft PR #18 (children+fold; works with deployed navbar.js). Card Q-NAV-2 (cmsg_017WNUkNK8kdDziPK58Pv6G95o2Ki11BCmyqKDxHy8Wtck): long labels A wrap (rec)/B ellipsis+hover/C h-scroll/D wrap+drag-resize; all options cut indent 40->16px/level (navbar.ts line ~758 padding formula NAV_PAD_PX+(NAV_GLYPH_PX+8)*(depth+1)).
- 20:49Z owner: on IG sites (smart-dak-pnc) the rail home should be "SMART Guidelines" -> https://litlfred.github.io/smart-html-jtd/ (tooltip "SMART Guidelines: landing page"). Card Q-NAV-3 (cmsg_017WNUkNK8kdDziPK58Pv6G9SmUYNjXEaVJLgkTrnxUTD9): A declare once in smart-base (rec) / B per IG / C jtd-hosted only.
- Bibliography entries top-level on smart-dak-pnc = old core pin 52e233c (before entry pages got parent); fix is a re-pin of IG forks (core/cat-harness/tools), no code. Also old ToC ▸. Plan: ask re-pin after spacing PR lands.
- 20:51Z Q-NAV-3 = C (jtd-hosted copies only). Drafts: tools#1800 (issue #1799, data-fa-home-name -> headName), cat-harness#1211 (navbar.js regen), smart-html-jtd#19 (compose writes data-fa-home-name = site title). smart-html-jtd#18 = landing folds (issue #17). Name shows after hosted IGs re-pin.
- 20:53Z owner asked for new node kind for smart-html-jtd (umbrella KG linking L1/L2/L3 libraries); sent to coordinator for a separate thread.
- Pending: Q-NAV-2 spacing card; then ask IG re-pins (pnc bibliography + ToC fold need it).
- 21:07Z all of tools#1800, cat-harness#1211, jtd#18, #19 MERGED. Owner: Folders list (kind rows, padding NAV_PAD_PX) should be slightly indented -> fold into spacing PR (pending Q-NAV-2).
- 21:20Z Q-NAV-2 = D built: issue tools#1808, draft PRs tools#1809 + cat-harness#1214 (wrap, 16px indent, Folders +8px, drag edge --fa-nav-w saved localStorage fa-nav-w). Subscribed; merge pair when green. Then ask IG re-pins. Shots /mnt/project-files/rail-fold-2026-11-10/spacing-*.png
- 21:20Z tools#1809 + cat-harness#1214 MERGED (tools 3ef7ce3, cat-harness 209b770). Asked coordinator to route IG re-pins (pnc bibliography nesting + all navbar changes).
