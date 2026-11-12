---
# folio-assistant-qxnv
$schema: bean/1.0.0
title: 'Memory: dth-sc#2 last steps (2026-11-01): SC3 variant views overlay PR dth-sc#10, SC5 owner sign-off PR dth-sc#12, cards Q-DTH1-1..3'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dth-sc-sc3-sc5.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: dth-sc#2 last steps (2026-11-01): SC3 variant views overlay PR dth-sc#10, SC5 owner sign-off PR dth-sc#12, cards Q-DTH1-1..3


Thread "Finish the dth-sc workplan" (cmsg_017WNUkNK8kdDziPK58Pv6G9C3xemqu5X8NCkfsnYkUGj1), parent "Drain DTH issues".

- SC3: issue dth-sc#9, draft PR dth-sc#10 (branch claude/dth-sc-variant-views, on main). Five views (Figs 15-19) in archimate/0.1.0-draft.1/dth-sc-overlay.archimate over smart-ra 0.3.0-draft.1, built by scripts/archimate/build_variant_views.py (stable ids). Owned: National/District/Facility Level groupings + Inventory Management System. Local validate.ts patched to read the overlay; #8 replaces it with core's (conflict: take #8's deletion).
- SC5: issue dth-sc#11, draft PR dth-sc#12 (claude/dth-sc-sc5-signoffs, stacked on #8). Agent-written signedOffBy "litlfred" removed from 5 p.4 exclusions; owner signs by committing 5 review suggestions; then rerun `bun run l1:coverage:write` and push.
- Cards: Q-DTH1-2 answered A (five views, 10:07Z); Q-DTH1-3 answered C (10:07Z): own element kept, overlap issues smart-ra#205 + dth-sc#13; Q-DTH1-1 (sign method) open. #12 CI red from base #8 (core d95399b needs newer cat-harness-tools); asked the cysv thread to repin.
- Gotcha: after switching branches with different core pins, `rm -rf folio-assistant-core` (gitignored mount) before remote-mount, else the registry throws on diig-phases-figure.

Related: folio-assistant-934v, folio-assistant-8iag, folio-assistant-gdav.
- 15:51Z owner refined the pause: extraction work on dth-* is allowed (computable graphics for PNGs, ingestion fixes), no change of meaning. #10 got SVG figures from the views (12cfe59). Merges still need the owner.
- 2026-11-01 evening: core#506 (Gateway_RecommendationInPlay in Process_EvidenceRetrieval: `no` skips the evidence search) MERGED 20:42Z as 0a39c5e (Q-DTH1-6 B, Q-DTH1-7 A). dth-sc#10 repinned core to it (c2f028a). Instances editing--fig-15..19 walked to Task_ReviewFindings; bean dth-sc-0klh holds the findings (beans/ state NOT pushed yet). Q-DTH1-8 (20:53Z) asks the editor: A accept as is, B relabel Fig. 15 data groups "Foundational components" as printed (recommended), C hold. #10 is content, so the non-content merge window (20:40Z +6h, to 02:40Z) does not cover it. After the decision: Task_ReviewFindings, options analysis (GW_Trigger no), Task_RecordDecision, accept, Task_Commit, then state:push and merge. The render-view.ts renderer has no label override (it draws element names).
- Business-process kind (tools#1316): dth-sc needs only a re-pin; its 3 bp- blocks stay in their chapter folders.
- 21:45Z: cat/dth-sc/beans manifest.json lacked state-manifest/v1 status/source, so CI never mounted beans (corpus gate red). Fixed dc3d2ef (author shows litlfred by mistake; amend+force refused). Handbook theme: tools#1336 (Q-DTH1-9 B, Q-DTH1-10 A merge when green). Next: one dth-sc re-pin (tools #1336 + cat-harness#932 from the business-processes thread) and redraw Figs 15-19 with theme "handbook" in a new PR.

- 2026-11-02 07:30Z: dth-sc#20 (handbook-look Figs 15-19) merged as b03a24e WITHOUT re-pin. Re-pin to tools 7baa295+ blocked: smart-base dth-terms stale (fixed by smart-base#280/#284, after fa train Q-TRAIN-16) and check:qa-reviewer-permission exit 2 (results ABSENT; reported to CI thread). Fig. 14 (#15) still pending.
