---
# folio-assistant-aqrb
$schema: bean/1.0.0
title: 'Memory: dth-pc/dth-sc handbook figures - extraction state and the owner''s rebuild choice (2026-10-31)'
status: completed
type: task
priority: low
created_at: 2026-10-31T12:02:26Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-figures-rebuild.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: dth-pc/dth-sc handbook figures - extraction state and the owner's rebuild choice (2026-10-31)


Owner chose option A on 2026-10-31 at 12:01Z in thread "Recreate dth-pc and dth-sc handbook figures" (cmsg_017WNUkNK8kdDziPK58Pv6G949cEh72JB5inoYrTUfPpiU). Each figure is rebuilt in the form that fits its type:
- architecture and actor figures become ArchiMate views in smart-ra (tools/archimate-dth)
- process figures become BPMN
- data models become class diagrams
- layered, phased or tree charts become SVGs generated from data (dth-hrh scripts/folio/diig_phases_hrh.py is the precedent)
- country examples and third-party figures stay as cited images

The PNG stays beside each rebuild as evidence.

Inventory: /mnt/project-files/dth-figures-2026-10-31/inventory.md.

Fixes and constraints:
- Caption bug ("Fig 1." with no dot) is cat-harness-tools#1119, fixed in PR #1120.
- SC Fig. 12 (SCISMM, third party) must never get a figure block (dth-sc thread).
- The dth-sc thread places new SC figures itself via seed_from_l1.py FIGURES; give it the who-iris paths.
- dth-sc has no site build yet. Agree with that thread before adding one.

Related: folio-assistant-gdav.

PRs (2026-10-31 12:36Z): merged cat-harness-tools#1120, #1123 (figure numbers + link icon), who-iris#147, folio-assistant-core#394 (figure-rebuild skill + figure-coverage).
Open: litlfred/smart-pcmt#2 (draft) holds the Fig 11 and NPC01101001 example Product instances (owner chose the smart-pcmt fork for them, 12:29Z). sushi not yet run: packages.fhir.org is blocked in the sandbox and the fork's ghbuild does not run sushi. A sushi CI job is ready on local branch claude/sushi-ci, not pushed.
Review method (owner, 12:29Z "A + B"): an agent proposes figure routes in the Contributor Log sheet or a figure-route GitHub issue, and the result goes to figures.json by PR.
Mermaid pilot dropped (one-source rule, "dont want to duplicate content").

smart-pcmt's FHIR content (Product, ProductAuthorization) is the upstream source for dth-pc Fig. 9 and its FHIR mapping table (owner, 12:21Z). WHO smart-pcmt stays read only; the litlfred fork takes example instances on branches (owner, 12:29Z).

DIIG phases chart (owner 2026-10-31 "B in who-iris"): data on who-iris entries (who-iris#149), generator/Tool diig-phases-svg in core#405, dth-hrh adaptation file in dth-hrh#68 (needs who-iris + core repins after merge), dth-pc Fig 4 generated at 6b54f23.
SMART approach chart (PC Fig 5): same pattern, who-iris#149 + core#405 tool smart-approach-svg; dth-pc 0ff201b. smart-pcmt#3 merged d3608b0 (13:25Z). PC Fig 9: owner chose A (13:30Z); smart-pcmt#4 merged 9e720db adds DthPcTradeItem/DthPcRegulatedTradeItem; dth-pc Fig 9 drawn from them. ITO bars card open (step-table schema smart-base#258 needs roleIds).

Layer rule (2026-10-31, check:reference-direction): core and lower layers must not name who-iris, fhir-harness or any higher instance, in comments, rationale or code. Say "a library entry" instead. core#442 reworded figure-data.ts and its validators.
- Rule (owner 2026-10-31 21:15Z, cmsg_017WNUkNK8kdDziPK58Pv6G9EdYSL9ZQidp86iQx53bnUF): on L2/DTH ingestion, figure rebuilds included, when unsure or blocked, file an issue on the litlfred fork, or a review-sheet row if one exists. Record what was found, the page and the options, then carry on. Skill dth-l1-to-l2-ingest (smart-base#249).

2026-11-01 16:30Z: PC Figs 6 and 7 rebuilt in draft dth-pc#12 (base claude/dth-pc-scaffold, thread cmsg_017WNUkNK8kdDziPK58Pv6G9Ra63v2Yjq9ChfMmb4Z9fdm). Fig 6 = hand-transcribed BPMN introduction/fig-6-anc-workflow.bpmn (smart-anc has no BPMN). Fig 7 = render-view SVG of smart-ra view id-92267636 (model layout and names differ from the PDF). Issue creation on dth-pc was refused by the safety check. Content PR: merge needs owner OK (card Q-FIG67-1).
Q-FIG67-1 A (owner tap 16:11Z): merge dth-pc#12 on green. Owner 16:12Z: "redo when color theme comes in" -> when cat-harness-tools#1281 (figure-theme.ts, render-view.ts) merges and dth-pc re-pins tools, re-render Fig 7 (scratch script: renderViewSvg on view id-92267636). This thread subscribes to #1281.
17:26Z dth-pc#12 MERGED into claude/dth-pc-scaffold (2ae942a), owner Q-FIG67-2 A (merge with corpus-gate red). Theme check: tools#1281 render-view output byte-identical, so Fig 7 needs no redo; render-poster can't draw nested groupings yet. Known tools bug: check:corpus-gate crashes on any dth-pc block-editing PR (cat-harness beans branch not mounted in CI), no fix yet (owner did not pick option C).
