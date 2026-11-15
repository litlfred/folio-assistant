---
# folio-assistant-a524
$schema: bean/1.0.0
title: 'Memory: Q-RAIL-2/Q-TRP-3 single harness fix fhir-harness#390 (issue #389) - task panel loader + contentTypes.ig.trustedScripts; demo #128 pending'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `demo-right-rail-2026-11-12.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Q-RAIL-2/Q-TRP-3 single harness fix fhir-harness#390 (issue #389) - task panel loader + contentTypes.ig.trustedScripts; demo #128 pending

Continues folio-assistant-apim.
- smart-trust-demo#128 (drop panel script tag + qa sidecar) at merge manager, open 06:20Z 11-12.
- fhir-harness#390 (branch claude/ig-trusted-scripts, 8c92a08, issue #389): IG_TASK_PANEL_JS in both layouts loads task-panel.css/js from data-panel sidecar dir; contentTypes.ig.trustedScripts (schemas/ig-trusted-scripts.ts), gate accepts bare listed src script on pages only. release label, ready, sent to merge manager.
- After #390 merges: smart-trust adds trustedScripts ["hcert-demo/hcert-demo.js"] + re-pin (translations thread owns); demo re-pin to bring panel back.
- After #128 merges: republish demo (stage-local.ts --publisher ig, after mount:lock) and check rail at 1440px.
- 06:20Z: #128 bpmn-generated fixed (business-processes.pot regenerated). refresh red = harness bug: ig-ast-refresh.yml with published exporter bundle never clones fhir-ig-publisher, so template seeder script missing -> build.fhir.org 404 for who.template.root#current. Fix fhir-harness#392 (issue #391). Merge manager treats #128 refresh as outside cause. Q-RAIL-MRG = A (owner 06:15Z): merge #390 + #128 on green. Demo re-pin after #390 + #392.
- 06:31Z #128 merged (62fc7cf9; Q-TPL-1 = A waived refresh red). Local republish blocked: main AST stale-inputs, root build refuses stale AST; local ig-ast-build.sh fails (tx.fhir.org blocked in sandbox). Path: after #390+#392 merge, demo re-pin PR (window allows merge manager), CI refresh rebuilds AST, then stage-local publish.
- 08:14Z #390 + #392 merged (fhir-harness main 9c39de71). 08:25Z demo re-pin PR smart-trust-demo#130 (issue #129, branch claude/repin-task-panel), all harnesses to main, with merge manager. Next: after merge, refresh rebuilds AST on main, then stage-local publish + check rail and task panel at 1440px.
- Gotcha: mount:remote refuses a re-pin when a mount has local edits; rm -rf the mount (or --fresh) first.
- 08:40Z #130 merged (e6fde6b4); refresh dispatched, green (AST de5aa6ce). Publish refused: QA review stale (7 Publisher narratives churn: /tmp/liquid-* name + timestamp). Re-review PR #131 (qa sidecar only), with merge manager. Then stage-local publish from main.
- 08:55Z #131 merged (6a41a09e). Root publish refused by parity guard: live root has vaxlink/ (retired #111), build doesn't; no CLI way to drop a dir by ruling (IG_DROPPED is hard-coded). Card Q-RAIL-3 (A remove vaxlink/ from gh-pages then publish, rec; B keep it via new harness option). Preview publishing from branch claude/preview-right-rail meanwhile.
