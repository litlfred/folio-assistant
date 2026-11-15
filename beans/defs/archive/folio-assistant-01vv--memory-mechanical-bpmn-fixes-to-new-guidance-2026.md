---
# folio-assistant-01vv
$schema: bean/1.0.0
title: 'Memory: Mechanical BPMN fixes to new guidance (2026-11-01): draft PRs, what''s done, what waits, local tooling scripts'
status: completed
type: task
priority: low
created_at: 2026-11-01T10:28:12Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `bpmn-guidance-fixes-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Mechanical BPMN fixes to new guidance (2026-11-01): draft PRs, what's done, what waits, local tooling scripts


Thread "Fix harness BPMN diagrams to new guidance" (cmsg_017WNUkNK8kdDziPK58Pv6G9LyZ6EoJf3PFkSRsG3DNWK5), sibling of folio-assistant-tx6r.
- Draft PRs, branch claude/bpmn-guidance-fixes (CONTENT changes: never merge without the user's word): cat-harness#897 (issue #895), folio-assistant-core#478 (#477), bootstrap#40 (#39), who-iris#156 (#155).
- Done: mixed gateways split (join gateway in front), bean closed once (one Process_BeanClose then GW_BeanClosedHow "How did it end?"), gateway after two-exit tasks (code-quality-gates parallel, activity-log "Task complete?").
- Left to the review thread: G2/G3/G6/G8 files and G5 (kg-separation, sub-kg-lifecycle, graph-detanglement). Ask it before touching G1/G4/G7/G9/G10 files.
- Store lanes (Q-BR-3 A, Q-DS all A): stacked draft PRs, branch claude/bpmn-store-lanes: cat-harness#914, core#487, fhir-harness#263 (issue #262), bootstrap#41, who-iris#158. Need cat-harness#907 (tools#1252 merged 10:58Z as 2163090; CI started before it, so re-run once if the interpreter fails). bootstrap#41 uses dataStoreRef knowledge-graph-data-store. Left by hand: core draft-to-publication (work plan), editing-hci-validation corpus lane.
- Layout pass DONE 11:3xZ at tools 1d82150 (findings 480->444), pushed onto the store-lane branches; new layout-only PRs folio-assistant-sci#165 (issue #164), aai-programme#62 (#61). fhir-harness files also got `<bpmn:dataStore id="work-plan">` so bpmn-js resolves the ref. Q-FIX-3 A (user 11:31Z): 104 names shortened (slugs dropped) in commits on the store-lane branches; before/after list /mnt/project-files/bpmn-guidance-fixes/overflowing-task-names.md. Slug thread told about the overlap.
- Render/check tools: worktree /home/claude/cht-render (from /tmp/cht-main); needs CAT_HARNESS_ROOT=/home/claude/cat-harness and bun install in bootstrap-tools (@fontsource/arimo). Only one cat-harness-tools checkout may sit in /home/claude.
- fhir-harness, folio-assistant-sci, aai-programme had no structural breaks; they only need layout/store-lane work.
- Q-FIX-2 D (user, 10:43Z): "determine which" task + named branch calls; render-kg-to-cdn calls Process_RenderKgToGitHubPages, other CDN stays tool-bound (higher layer); test-data-curation got a determine task, call stays type-bound (specialisation processes don't exist yet).
- Local tools: /home/claude/tools/{split_mixed,close_once,gateway_after}.py (not committed). .pot re-extract for core/who-iris rewrites paths; keep only changed diagrams' files and sed `#: processes/` back to `#: ../<repo>/processes/`.
- HANDED OVER 2026-11-01 22:25Z (coordinator): S9 (thread cmsg_017WNUkNK8kdDziPK58Pv6G94ns12Kk5QnyoMAiWhsE4iU) owns the BPMN guidance PRs in cat-harness, core and bootstrap; S9B (cmsg_017WNUkNK8kdDziPK58Pv6G9RVAQdJzdBJpU6pZcQSZaL3) owns those in fhir-harness, sci, who-iris and smart-base. This thread must not push to them; send fixes to the owner. Merged: cat-harness#897, bootstrap#40, sci#165. aai-programme#62 is still watched here.
