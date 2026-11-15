---
# folio-assistant-aa2f
$schema: bean/1.0.0
title: 'Memory: DTH migration to the business-processes kind (Q-SUBG-6 A): dth-pc#14, dth-phc#24 drafts; dth-hrh has nothing to migrate'
status: completed
type: task
priority: low
created_at: 2026-11-01T18:56:47Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `business-processes-migration.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: DTH migration to the business-processes kind (Q-SUBG-6 A): dth-pc#14, dth-phc#24 drafts; dth-hrh has nothing to migrate


Thread "Migrate DAK diagrams to business-processes" (cmsg_017WNUkNK8kdDziPK58Pv6G9NsHfEJYjsUcqvFSgCe7DiA), 2026-11-01.
- Kind PRs: cat-harness-tools#1316 (stacked on #1312, #1313) + cat-harness#932. Re-pin DTHs only after all merge. See folio-assistant-f7z8.
- dth-pc#14 (draft, base claude/dth-pc-scaffold): adds undeclared processes/ (PC-BP-01..10 + decisions/) as business-processes.
- dth-phc#24 (draft, base main): processes/ kind processes -> business-processes (6 human-lifecycle BPMNs).
- dth-hrh: no processes folder on main; draft dth-hrh#64 puts BPMNs inside folio chapters only. Nothing to declare.
- BPMNs inside folio/ chapter folders stay as folio blocks (not moved).
- 21:50Z tools#1312/#1313/#1316 merged (tools main 6f431f0); both PRs re-pinned cat-harness-tools to 6f431f0 (lock + config + consent evidence = user's 18:53Z migration ask). Next: re-pin cat-harness after cat-harness#932 merges (its gate checks kind vs mounted cat-harness), then mark ready for full CI, then ask merge OK (window expired 20:27Z).
- 2026-11-08 18:2xZ: restarted (stale-thread card A). Bases' 11-05 frozen pins already include tools#1316 + cat-harness#932, so branches were rebuilt on base with ONLY the declaration (no pin change), force-pushed, marked READY. dth-pc#14 stays based on claude/dth-pc-scaffold (PR #1 unmerged). Merge still needs user OK.
- 2026-11-08 18:35Z full CI: both fail only on base-failing gates with new lines. phc#24: uml:overview (business-processes "never unaudited": no gate @covers it; asked kind thread). pc#14: same + subgraph-coverage serialisations (all dirs lack them), foreign-paths false positive (tools external-schemas.ts "processes"), readme stale (fixed: generated processes/README.md). Q-BPM-1 asks merge now vs wait for layer coverage fix.
- 18:45Z tools#1733 (business-processes @covers) merged 1c1632a, but bases use 11-05 FROZEN pin set (user card "Freeze one set", rpc6); tools-only re-pin skews (dth-phc#7 precedent). Not re-pinned. Q-BPM-1 withdrawn; Q-BPM-2 asks A merge on frozen pins w/ accepted "never unaudited" line (rec) / B re-pin tools alone / C hold.
- 2026-11-09 10:34Z Q-BPM-2 A tapped (merge both on frozen pins, accept "unaudited" line). dth-phc#24 MERGED 467c1ec. dth-pc#14 waits on scaffold PR #1 (still open), then merge it.
