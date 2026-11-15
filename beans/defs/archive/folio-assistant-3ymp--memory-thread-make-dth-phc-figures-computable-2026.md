---
# folio-assistant-3ymp
$schema: bean/1.0.0
title: 'Memory: Thread "Make dth-phc figures computable" (2026-11-11) - survey of 15 figs, issue dth-phc#38, card Q-PHCFIG-1'
status: completed
type: task
priority: low
created_at: 2026-11-11T11:38:50Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-phc-computable-figures.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Make dth-phc figures computable" (2026-11-11) - survey of 15 figs, issue dth-phc#38, card Q-PHCFIG-1

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9TfxoPm9oYtbFags1abRRjp. User 11:36Z: "make computable figure 1 and more". Explicit ask, so extraction content work on dth-phc is allowed (see folio-assistant-yqdf); merges need owner OK + full suite.

Issue litlfred/dth-phc#38 holds the survey. Already computable: 3 (ArchiMate), 5, 6 (core Tools), 7, 10 (BPMN), 14 (local script scripts/figures/fig14_decision_tree.py). Pictures: 1, 2, 4, 8 (3rd party Tran), 9, 11, 12, 13, 15 (3rd party, excluded).
Fig 1 Digitization wording differs from the glossary definition: keep the figure's words, note it.
Card Q-PHCFIG-1 (11:50Z, open): A = data + script inside dth-phc like Fig 14, Fig 1 then the rest in one PR (rec, being worked); B = who-iris data + shared core Tool; C = Fig 1 only, then review.
Fig 1 done 11:5xZ: draft PR dth-phc#39 (branch claude/dth-phc-computable-figures): figure-data/fig-1-paper-to-digital.json (staircase) + rows read from table block t-ch01-fig-1.md, generator scripts/figures/fig1_paper_to_digital.py --check. Local mount via .claude/hooks/session-start.sh; changing a figure .md needs `bun run review:anchors`. Preview: /mnt/project-files/dth-phc-figures-2026-11-11/.
Related: folio-assistant-aqrb, folio-assistant-2ncj.
12:10Z: Figs 4 (figure-data/fig-4-collect-once.json) and 12 (from table block t-ch03-fig-12.md) pushed to #39; package.json check:figures (not in CI: no workflow permission). Figs 2, 8, 9, 11, 12, 13 already had table blocks (t-ch0x-fig-N.md). Card Q-PHCFIG-2 open: A = SVG from table blocks for 2/9/11/13 + Fig 8 as signed-off picture exclusion (rec), B = table block stands as figure, C = leave. Gotcha: fig14_decision_tree.py takes argv[1] as OUT path, so `--check` writes a stray file named --check.
11:52Z: Q-PHCFIG-1 = A (typed "A", closed by me). Q-PHCFIG-2 tapped B but typed "A" 2s later -> conflict; Q-PHCFIG-3 asks to confirm (A = SVG from tables + Fig 8 picture, B = table block stands as figure, rec since tapped). figure-coverage.ts counts a table block with a figure label as computable.
12:05Z: Q-PHCFIG-3 = A (tap). Figs 2/9/11/13 drawn from table blocks by scripts/figures/table_figure.py (STYLES per fig); Fig 8 rebuild exclusion proposed (unsigned). figure-coverage: 14/15 computable (15 picture). Changing figure .md also needs folio-l1-coverage.ts rewrite (l1-coverage.json node moves). Card Q-PHCFIG-4 open: A = ready + merge on green (rec), B = ready, owner merges, C = hold.
11:59Z Q-PHCFIG-4 = A: #39 marked ready (dth-phc full tier runs on ready_for_review, run 43016444042); merge on full green, then check live site.
12:00Z user: "activity ids names, decision IDs etc should be all cross linked properly". Done 7555f20: links live in table blocks (markdown `[x](url)`), table_figure.py/fig12 draw them. Targets: BPMN page https://litlfred.github.io/dth-phc/en/cat-harness/processes/anc-registration-workflow-a.html#step-Tn (#decisions for gateways, #steps for Sub8); #dt:keep-data-element; smart-hiv https://litlfred.github.io/smart-hiv/artifact/PlanDefinition-HIVB2DT.html (B9, D4); #pers:health-service-user/clerk/health-worker; #rec:who-2019-... Site inlines <img> SVGs (docs-ui.js) so SVG links work. Unlinked: HIV.DT.02/.04, FP.A-C (smart-fp no BPs), refs (wait #31). Q-PHCFIG-5 open: HIV.DT.05 -> HIVC23DT (A link+note rec, B issue). Merge #39 on full green after Q5 (Q4 = A).
12:08Z Q-PHCFIG-5 = A pushed 405232a (link title -> SVG <title>). Waiting full suite on 405232a, then merge (Q4 = A).
12:09Z: ready_for_review alone ran FAST tier only on dth-phc (shards skipped). Did draft -> add 'release' label -> ready on 405232a to get the full tier. Verify shard jobs ran (not skipped) before merging.
12:19Z #39 MERGED abcd9f3 after full tier (8 shards green; needed release label + draft/ready toggle). Site publish run 43019081798; check-in scheduled +20 min. Open: Fig 8/15 sign-off by owner (never write user's name in signedOffBy).
12:39Z live: publish 43019081798 success; gh-pages en/dth-phc/index.html uses all new SVGs. Thread left open for Fig 8/15 sign-off.
