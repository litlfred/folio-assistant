---
# folio-assistant-8j0l
$schema: bean/1.0.0
title: 'Memory: Beans-by-process visualiser (processed-beans / processed-bean pages): issue, bean, mockup, cards, data finding'
status: completed
type: task
priority: low
created_at: 2026-11-02T18:41:18Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `processed-beans-visualiser-2026-11-02.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Beans-by-process visualiser (processed-beans / processed-bean pages): issue, bean, mockup, cards, data finding


Thread "Build bean-by-process visualizer" (cmsg_017WNUkNK8kdDziPK58Pv6G9PqHijxfA1UbP1sLEYKpWLG), started 2026-11-02 18:35Z.
- Existing: only per-instance pages (cat-harness-tools scripts/workflow-view.ts + state-visualizer.ts, bean v49e). No process-wide or per-bean page.
- Issue cat-harness-tools#1413; plan bean folio-assistant-pbv1 on fa cat/cat-harness/beans (63bf5e1); mockup https://claude.ai/artifact/BhKAqXAqj7Ay49YPeKrcEr. Code branch claude/processed-beans in cat-harness-tools.
- Finding: 12 workflow instances only; all running ones last moved 33-43 days ago; agents stopped recording instances early Oct.
- Cards 18:45Z: Q-PBV-1 (rec A build + follow-up so agents record instances) cmsg_017WNUkNK8kdDziPK58Pv6G9Led43xi3K619Ko4SYfc1Ge; Q-PBV-2 (rec A harness route + /beans/processed-beans/ alias) cmsg_017WNUkNK8kdDziPK58Pv6G9X7UqnrfJcoqe33GL8Nkw6q.
- Owner 18:40Z: commit early and often, push.
- 19:10Z: Q-PBV-1 A, Q-PBV-2 A; owner wants PATH IRIs, no query strings (`.../beans/<store>/processed-beans/<processId>/`, `.../processed-bean/<beanId>/`). Draft PR tools#1414 (fae97eb, 8 tests, smoke OK). Follow-up cat-harness#988 (agents record instances). Bean pbv1 updated (5a831d6). Local build needs sibling /home/claude/bootstrap-tools with `bun install`.
- 19:15Z Bean-store/agent-dispatch proposal (owner 18:56Z, framed by WHO Assured AI Gemini concept note 18:58Z): cat-harness#991, draft PR #992 (docs/proposals/bean-store-and-process-driver-2026-11-02.md), bean bsd1. Cards Q-BSD-1..5 (all rec A) posted 19:15Z in this thread. Owner asked 18:50Z to merge tools#1414 when green (repo has no auto-merge).
- 19:03Z Q-BSD-1 B (bean position ONLY in instances; store ops positions/beansAt), Q-BSD-2 A (deployment description picks store Tool), Q-BSD-3 A (beans-serve first launcher), Q-BSD-4 A (git history = git log + instances), Q-BSD-5 A (run-scoped store for benchmarks). Proposal #992 updated (3a37ee3). Next: step 1 (work-plan-store as operations + Tool pages).
- 19:10Z owner: ITB is THE testing tool; harness per run = state machine + run-scoped Beans store + materialised layered context repo (KG+skills+MEMORY.md+AGENTS.md); multi-agent plans (agents A,B,C with bean sets); agents minimally aware of test. Added §4.8 to #992 (589f27b). Step 1 draft PR cat-harness#993. Card Q-BSD-6 (who drives a run, rec A ITB) cmsg_017WNUkNK8kdDziPK58Pv6G95GM68vGddGLobP2KpSb7qu.
- 19:20Z tools#1414 MERGED (4431b7c). Bean bsd1 handover pushed (e421121 on fa cat/cat-harness/beans). #992 + #993 still draft, green-ish; next = merge them, then step 6 (remove git cmds from 6 skills).
- 11-03 04:56Z #992 and #993 MERGED. Step 6 (git cmds out of 6 skills) not started; asked owner 11-07.
