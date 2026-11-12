---
# folio-assistant-f7z8
$schema: bean/1.0.0
title: 'Memory: Per-subgraph Processes pages (processes/<instance>/) never existed; added 2026-11-01 in tools#1312 + cat-harness#930; smart-trust BPMNs blocked by in...'
status: completed
type: task
priority: low
created_at: 2026-11-01T18:25:09Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `processes-subgraph-pages.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Per-subgraph Processes pages (processes/<instance>/) never existed; added 2026-11-01 in tools#1312 + cat-harness#930; smart-trust BPMNs blocked by interpreter (Q-SUBG-2)


Thread "Fix per-subgraph process pages" (cmsg_017WNUkNK8kdDziPK58Pv6G9G2GsguUks3HLTMeL7jA2qH), 2026-11-01.
- Processes viewer (gen-processes-viz.ts) had NO per-instance pages; tools/library/beans etc use `subgraphs: "instance"` on their visualiser in cat-harness.json.
- Fix: cat-harness-tools#1312 (issue #1311, branch claude/processes-subgraph-pages): processes/<instance>/index.md, "By subgraph" table, root-instance read, `processes-viewer` subject reader in site-coverage.ts. cat-harness#930: flag `subgraphs: "instance"`. Merge #1312 FIRST.
- smart-trust declares no processes dir; onboarding thread adds input/business-processes/ to smart-trust.json.
- loadProcessModel refuses bpmn:SendTask/ReceiveTask/BoundaryEvent, so all 9 smart-trust onboarding diagrams "would not load". Q-SUBG-2 answered B (18:20Z): tools#1313 makes SendTask/ReceiveTask activities; loadProcessModel opts {view:true} lists unsupported elements on model.notRun; the viewer warns. All 9 smart-trust diagrams load locally. GDHCN ids fail the workflow-interpreter test's /^Process_/ check (onboarding thread told).
- Local test recipe: copy smart-trust, `bun run <tools>/scripts/mount-from-lock.ts --root .` (fast), replace cat-harness-tools/cat-harness with tar copies of working trees, `bun install`, then `bun run cat-harness-tools/scripts/gen-processes-viz.ts --site /tmp/site`.
- Stage bugs fixed: tools#1314 (detectPublisher allows `# main` comment), tools#1315 (banner counts meta-refresh stubs as redirects).
- github.io is blocked by the proxy; read gh-pages via `gh api -H "Accept: application/vnd.github.raw" repos/<o>/<r>/contents/<path>?ref=gh-pages`.
- 18:36Z Q-SUBG-3 A (processes + loosen tests) chosen; local test showed 20 new failures in 10 files, so Q-SUBG-4 asks A vs B (business-processes kind, built locally on tools branch claude/business-processes-kind, stashed: registry kind + businessProcessFiles in known-skills + viewer/render-bpmn read it; cat-harness coversKinds both).
- 18:44Z Q-SUBG-5 A: mark ready + merge on green all this thread's PRs (tools#1312-1315, cat-harness#930 after #1312, plus the B PR). All marked ready 18:44Z.
- 18:53Z Q-SUBG-6 A: kind `business-processes` within `processes`; workflowDirs skips it BY KIND. tools#1316 (stacked on #1312+#1313) + cat-harness#932 (stacked on #930), both ready; merge on green per Q-SUBG-5 A. Owner 18:53Z: migrate DAKs as needed; siblings told. Migration thread cmsg_017WNUkNK8kdDziPK58Pv6G9NsHfEJYjsUcqvFSgCe7DiA (dth-pc/hrh/phc); dth-sc thread does dth-sc (3 BPMNs inside folio chapter dirs; kind is per directory). Ping both + onboarding thread when #1312/#1313/#1316 merge. smart-ra excluded (content paused).
- 18:57Z folio kind is not kgContent, so folio-block BPMNs never reach the engine; don't move them. Follow-up planned: businessProcessFiles also reads folio blocks whose manifest kind is business process (field pending from dth-sc thread). Drafts: dth-pc#14 (processes/ -> business-processes, on scaffold), dth-phc#24 (processes -> business-processes); dth-hrh none. All wait for tools#1312/#1313/#1316 merge + re-pin.
