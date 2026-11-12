---
# folio-assistant-1x4m
$schema: bean/1.0.0
title: 'Memory: Design of a new node kind making smart-html-jtd the umbrella KG of SMART Guidelines (links L1/L2/L3 libraries); cards Q-UMB-1 name, Q-UMB-2 where'
status: completed
type: task
priority: low
created_at: 2026-11-10T20:54:47Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `jtd-umbrella-node-kind-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Design of a new node kind making smart-html-jtd the umbrella KG of SMART Guidelines (links L1/L2/L3 libraries); cards Q-UMB-1 name, Q-UMB-2 where

Thread "Make smart-html-jtd an umbrella node kind" (cmsg_017WNUkNK8kdDziPK58Pv6G9DEZk3DJmX24MEwH1cdheht), started 2026-11-10 20:53Z from user msg in navbar thread.
- User: smart-html-jtd = new node kind linking one or more libraries of L1 docs (e.g. who-iris), same for L2, L3..., umbrella KG of SMART guidelines; wants a good kind name.
- Existing pieces: kinds are `nodeKind()` in cat-harness-tools schemas/kg/node-kind.ts (versioned `name/x.y.z`); smart-base has document-kinds (l1, l1-guideline, dth, l2-dth, dak) as JSON `document-kind/1.0.0`; jtd today = sites.json + scripts/catalog.py (prefix discovery, publications = who-iris handles) + landing.py.
- Proposed shape: declaration `levels[]` (L1..L4), each with `libraries[]` = {repo, library, select: all|handles|discover-prefix}; members linked by IRI, never materialized (see folio-assistant-9fo8 rule); landing/rail read it, keeping navbar thread's children/fold rail shape (jtd#18/#19, tools#1800).
- Cards: Q-UMB-1 name (A guideline-portfolio rec, B library-federation, C umbrella-kg, D knowledge-hub); Q-UMB-2 where defined (A generic in tools + SMART subclass in smart-base rec, B smart-base only, C tools only).
- 20:57Z Q-UMB-1 = A: kind name `guideline-portfolio`. Q-UMB-2 pending.
- 20:58Z Q-UMB-2 = A. ~21:25Z drafts (subscribed): tools#1804 (issue #1803, schemas/kg/portfolio.ts `portfolio/1.0.0`: levels -> libraries, source library|discover|repos, memberKind, memberOverrides); smart-base#340 (issue #339, smart-base/schemas/guideline-portfolio.ts, L1-L4 in order; needs tools re-pin after #1804); smart-html-jtd#21 (issue #20, guideline-portfolio.json + catalog.py reads it; landing byte-identical). Follow-up: show levels on landing/rail.
- 21:08Z Q-UMB-3 = A: tools#1804 + jtd#21 marked ready, merge request sent to merge manager. smart-base#340 needs tools re-pin after #1804 merges, then ready.
- 22:45Z tools#1804 + jtd#21 MERGED. smart-base#340: re-pinned tools to 002c324 (4d9ebe6, consent Q-UMB-3 A; workflow pins moved; layers on claude/cat-layers/9a48afae...), marked ready, full CI running; then merge request to merge manager.
- 23:27Z smart-base#340 MERGED: all three done. Possible follow-up (not started): show L1/L2/L3 levels on landing + rail.
- Local test: siblings under /home/user, /home/user/node_modules -> cat-harness-tools/node_modules; smart-base test via symlink smart-base/cat-harness-tools -> ../cat-harness-tools.
Related: folio-assistant-mn3z
