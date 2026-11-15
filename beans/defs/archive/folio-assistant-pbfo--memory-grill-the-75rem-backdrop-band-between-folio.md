---
# folio-assistant-pbfo
$schema: bean/1.0.0
title: 'Memory: "Grill" = the .75rem backdrop band between folio LHS navbar strip and white content (NOT the icon strip); fixed in tools#1682 + cat-harness#1137; rea...'
status: completed
type: task
priority: low
created_at: 2026-11-10T19:27:15Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `folio-left-gap-icons-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: "Grill" = the .75rem backdrop band between folio LHS navbar strip and white content (NOT the icon strip); fixed in tools#1682 + cat-harness#1137; reaches a site only via cat-harness re-pin


User vocabulary: "left grill" / "strip under blue bar left of display" = `.main-content-wrap{padding-left:.75rem}` injected by `src/core/edit-links.ts` LINK_CSS (cat-harness-tools), copied to cat-harness `site-chrome/assets/js/edit-links.js`. NOT the 56px navbar icon strip. A vertical bar next to it on dth-hrh is the REMARK block's 3px left border (content), not chrome.

2026-11-08: padding-left set to 0 (right 2.5rem kept), cat-harness#1137 merged 13:25Z (merge bb312c50). PRs: cat-harness-tools#1682, cat-harness#1137, thread …98xsmDrkh85fhWzGUmaFEzE.

2026-11-10 (thread …A4FVReTMWQNcJHJWxMVMtd): user asked again why the gap exists. Cause: dth-hrh pins cat-harness 42d4f15 (pre-fix; #107 moved tools only); dth-sc + dth-phc pin f5c9140 (pre-fix); folio-assistant has it. Owner chose B (every layer to main, 19:54Z). PRs (draft, branch claude/repin-mains-gutter, subscribed): dth-hrh#110, dth-sc#28, dth-phc#36; cat-harness df6a3c0, tools 1abe68e. WAS red: 'Layers cache ref for a re-pinned lock' (sandbox can't push refs/cat/layers to folio-assistant); user asked 20:05Z to run `bun run cat layers:publish` locally, or use cat-harness-tools#1784 (claude/cat-layers/<key> branch + mover) once merged. 20:16Z: tools re-pinned to ba1af6f (#1784) + layers-move.yml added; `bun run cat layers:publish` from sandbox works (claude/cat-layers/<key>); all green; handed to merge manager (ready + ready-to-merge label). dth-pc/dth-sfp main has only .github (nothing to re-pin). DONE 21:00Z: gap gone live on dth-hrh, dth-phc, dth-sc. Before/after: /mnt/project-files/dth-gutter-2026-11-10/.

Local preview trick: litlfred.github.io blocked by proxy; sparse-clone the site's gh-pages (index.html, index.hydrated.html, /assets/, /en/<ig>/assets/), serve the PARENT dir with a symlink named after the repo (paths are /<repo>/...), launch chromium with --no-proxy-server and use 127.0.0.1. Playwright mouse at (0,0) hovers the navbar open: move it away first.
