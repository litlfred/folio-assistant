---
# folio-assistant-vkb0
$schema: bean/1.0.0
title: 'Memory: smart-ra Fig 3.5 "Integrated View" computable rebuild - coverage findings and open cards Q-IV-1/2 (2026-11-01)'
status: completed
type: task
priority: low
created_at: 2026-11-01T11:13:55Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-ra-integrated-view.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-ra Fig 3.5 "Integrated View" computable rebuild - coverage findings and open cards Q-IV-1/2 (2026-11-01)


Thread "Generate smart-ra integrated view diagram" (cmsg_017WNUkNK8kdDziPK58Pv6G9VQAuD3atZr35AFviySHZFo), started 2026-11-01 11:08Z. It owns ONLY folio dpi-h-ra Figure 3.5 (media/image26.png, plus the user's longer poster). The sibling "Make smart-ra figures and tables computable" thread does every other figure and table.

Findings (model archimate/0.3.0-draft.1 at 7aaec92): 67 boxes; 14 in the model, 23 near matches, 30 missing. There is no Client Registry, LHR is only "SHR Repository", LIMR is named "Registry" instead of "Repository", 5 of the 7 goals are missing, and REDDHI is not marked. tools/archimate-dth/add_views.py builds the view; a local dry run added 131 items and is idempotent. That tool has no folder for technology types (Node), which needs a one-line fix.

Files: /mnt/project-files/smart-ra-integrated-view-2026-11-01/ (findings.md, inventory.json, dpi_h_integrated.py spec, SVGs).

Answers: Q-IV-1 A (ArchiMate views in the fork, 11:19Z). Q-IV-2 B (rename the existing elements), but 12 of the 23 near matches are narrower elements used by SC/PC/HWR views, so Q-IV-3 is open: A = rename 11 plus new for 12 (recommended), B = rename all, C = keep as is. The user asked to see all three side by side (compare-abc.html). Version A is pushed to litlfred/smart-ra branch claude/integrated-view-archimate (008f7b5). add_views.py now supports RENAMES (formerName) and technology types. No PR yet. 11:30Z: the user asked for all three kept in one doc with a reason under each, in the "pretty" (poster) style: integrated-view-options.html, drawn by pretty.py (in project files; to move into cat-harness-tools later) from the model. The spec stores each box's figure text as figureNote and reddhi=true; add_views.py has PROPERTIES. Branch at 5ab647f. PAUSED 2026-11-01 15:39Z: the user's rule is no content work on smart-ra or dth-* (cmsg_017WNUkNK8kdDziPK58Pv6G9XsHteHQk5PVTdfNFHby24J). The branch stays as is and Q-IV-3 is on hold. Only the tool part (add_views.py RENAMES/PROPERTIES/technology folder, pretty.py renderer) may go ahead as functional work. Ask before any PR, because this is a content change. See folio-assistant-aqrb.

15:41Z the user said: put in the option closest to the narrative text, merge it to main, and file an issue for the other two (an explicit exception to the pause). A chosen (Q-IV-3 closed as A). PR smart-ra#210 (closes #209) merges when its checks pass. Issue #211 holds B/C (branch claude/integrated-view-alternatives) and the semantic issues. Q-IV-4 is open: one theme for all smart-ra figures/tables; A = poster layout with ArchiMate layer colours (recommended). The sibling thread's figures use render-view.ts, so the theme should plug in there.
Q-IV-4 answered A (15:53Z): poster style, ArchiMate layer colours for all smart-ra figures and tables. Draft cat-harness-tools#1281 (issue #1280): archimate/scripts/figure-theme.ts (LAYER_FILL source, TABLE_CSS, layerClass) and render-poster.ts (generic; --star-property reddhi --star-label 'REDDHI component' for smart-ra). The user asked (15:54Z) for the review URL on main: after #210 merges, run stage-local on smart-ra main and post the live view link.
16:06Z smart-ra#210 merged (ed303d4); main site publish via stage-local started. 16:12Z the owner tapped Q-IV-5 A; cat-harness-tools#1281 merged (84ce025). It was still a draft, so only the fast tier ran: watch main's full CI.
16:17Z smart-ra main site published (6b1bd1d); view pages at en/dpi-h-ra/archimate/0.3.0-draft.1/views/dpi-h-reference-architecture-integrated-view-fig-3-2/ and ...-dpi-h-layers-fig-3-5/. cat-harness-tools main CI is green after #1281. Open follow-ups: wire render-poster into gen-archimate-pages, put tables on TABLE_CSS, and the semantic issues in #211.
16:45Z the user asked for poster-like coloured band backgrounds (16:35Z). cat-harness-tools PR #1289 (issue #1288, branch claude/poster-band-colours, b1921c82) adds tinted band grounds and coloured header strips; box fills stay ArchiMate. Card Q-IV-6 is open (A = merge when green). Sample image: integrated-view-poster-bands.png in project files.
16:39Z Q-IV-6 A tapped: merge #1289 when green.
16:50Z poster theme for all views: cat-harness-tools PR #1294 (issue #1293, branch claude/poster-theme-views, stacked on #1289): render-view default theme poster, posterFits + gen-archimate-pages, config `poster` block. smart-ra preview branch claude/poster-theme-preview pins tools to it (STAGING only, never merge). Q-IV-7 (element pages A+B+C) and Q-IV-8 (where definitions live; rec A glossary + defining section) open. Glossary thread (…N3K9W9aycrcqDwadN5Jy7H) says: reuse element property `skosConcept` (core glossary-archimate.ts) and block `defines:` + :defterm; build the passage matcher as a reusable core function next to glossary-term-links.ts.
16:49Z Q-IV-8 A tapped (glossary + defining section; join on skosConcept / defines).
16:55Z D (definitions) committee PR: litlfred/smart-ra draft #215 (branch claude/ra-element-definitions), issue #214, label "hold: committee sign-off". OWNER: HOLD FOR MERGE until committee sign-off (16:50Z). 12 Appendix C components -> glossary terms (verbatim first sentence of "What it is"), `defines` + :defterm on that paragraph, skosConcept in dpi_h_integrated.py SKOS_CONCEPTS. Owner asked (16:51Z) for review + staging URLs in #214 and in the DPI-H sheet (asked DPI-H watcher thread …VZ4HJjDbGFC5aMakt3gA63). Poster preview branch claude/poster-theme-preview still to be staged. Never run two stage-local builds or switch branches during one in /home/claude/smart-ra.
16:55Z #214/#215 = CS-289 on DPI-H log Agent - Change Sets row 209 (watcher adds staging URL).
17:02Z glossary thread: Q-GLO-3 C = glossary row is the defining site, narrative = provenance; core#498 scripts/term-passages.ts passagesFor(repoRoot, labels) to reuse for element pages. Asked whether #215 should drop defines/:defterm.
17:03Z glossary thread: keep defines/:defterm in #215; none of the 12 terms has an RA glossary row, so source stays on the Appendix C block. No change needed.
17:36Z #1289 merged (6791349).
17:40Z previews live: STAGING/claude-poster-theme-preview/ and STAGING/claude-ra-element-definitions/ (links in #214, #215, #1293). #1294 CI re-run once (unrelated main drift failures).
17:55Z #1294 now also: archimate.js bpmn-figure controls on view pages, archimate-blocks posters (c0038d1). Preview branch: Figs 3.2 (f-3-3-8f9618) and 3.5 (f-3-5-3-93e90c) -> fig-3-2-integrated-view.svg / fig-3-5-dpi-h-layers.svg via config figures (preview only, content -> ask before main PR). Q-IV-9 open (LMIR outlier: A move in model). New thread 'Make remaining DPI-H RA figures computable' (…UepaMqGRybGWQGzxmMg5KD) owns other figures; I own 3.2/3.5.
18:00Z Q-IV-9 A: branch claude/lmir-layout (654a02db, move Update Subscription/Notification id-9279e61d... to x=912 y=738 in 0.3.0-draft.1 LMIR Overview) merged into preview branch; no PR to main yet (content, ask after preview). Worktree /home/claude/smart-ra-lmir.
18:10Z smart-ra#218 (remaining-figures thread …UepaMqGRybGWQGzxmMg5KD) is stacked on claude/poster-theme-preview: never force-push/retarget that branch without telling them.
18:15Z landing title fix: folio-assistant-core#510 (issue #509, branch claude/landing-document-titles adc6e90): landing lists docs by title + " - meta.status", drops duplicate "The document" link. #1294 now 92790d6 (key width fix from remaining-figures thread, Fig 2.3 overflow). Preview branch 06724ee6e7 pins both + dpi-h-ra.ts meta.status "Working Draft"; rebuild running.
18:48Z Q-IV-10 A: #1294 merged (73c4690).
19:28Z smart-ra#218 is no longer stacked on claude/poster-theme-preview (one commit on main). A future main PR for Figs 3.2/3.5 needs a config/model merge with it: re-run dpi_h_integrated.py / dpi_h_figures.py on whichever lands second. 19:25Z core#510 a7fc55d also puts the status in the document page h1 and <title>; preview 407d75af40 rebuilding.
2026-11-02 06:21Z: core#510 merged (head cb821ce7, someone else merged). Glossary thread: owner Q-GLO-6 A, no '#' in node IRIs (ns# -> ns/, cat-harness-tools#1378, clean break). #215's skosConcept 'dpi-h-ra.glossary.json#<id>' may need to change to the term's path IRI after #1378 lands.
