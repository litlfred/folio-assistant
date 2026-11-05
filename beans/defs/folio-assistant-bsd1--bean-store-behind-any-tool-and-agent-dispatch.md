---
# folio-assistant-bsd1
$schema: bean/1.0.0
title: 'BEAN STORE BEHIND ANY TOOL + STATE MACHINE STARTS ANY MODEL''S AGENT: proposal (WHO Assured AI / Gemini benchmarking context)'
status: in-progress
type: feature
priority: normal
created_at: 2026-11-02T19:10:00Z
updated_at: 2026-11-05T13:34:27Z
parent: folio-assistant-yj32
tags:
    - work-plan-store
    - workflow-state
    - agent-dispatch
    - model-benchmark
    - handover
---

## How to resume (read this first)

Owner ask 2026-11-02 18:56Z (thread cmsg_017WNUkNK8kdDziPK58Pv6G9PqHijxfA1UbP1sLEYKpWLG): process docs independent of the Beans store Tool (git branch is one Tool; a server/MCP service another); BPMN state machine starts an agent via API with a bean tagged process+task, tracks it, bean evolution over time readable. 18:58Z: write it in the context of the WHO Assured AI concept note (Gemini/Antigravity integration, Routes 0/A/B, MCP, GEMINI.md parity, ITB traces).

- Issue cat-harness#991; draft PR cat-harness#992 (branch claude/bean-store-proposal, b56cb05)
- Proposal: cat-harness docs/proposals/bean-store-and-process-driver-2026-11-02.md
- Related: cat-harness#988 (record instances), #972 (Beans store links), tools#1413/#1414 (processed-beans pages), #686 req:model-benchmark ("a benchmark never writes to beans/")

## Next

- [x] owner answered Q-BSD-1 B (position only in instances), 2 A (deployment picks Tool), 3 A (beans-serve first launcher), 4 A (git log + instances), 5 A (run-scoped store), 6 A (ITB drives test runs). Proposal PR #992 head a4fbbe4, §4.8 = ITB test harness (owner 19:07Z).
- [x] step 1: draft PR cat-harness#993 (branch claude/work-plan-store-ops, 698e841; draft fast tier green): work-plan-store as operations, new skill work-plan-store-git-branch, todo-manager updated
- [ ] mark #992/#993 ready + merge when green (non-content docs)
- [ ] step 6: remove git commands from bean-coordination, idle-backlog, bean-drain, continual-progress, workflow-state, process-state
- [ ] steps 2-5, 7-12 per proposal §5
- Also in this thread: tools#1414 (processed-beans pages, ready; owner said merge to main 18:50Z; repo has no auto-merge, merge by hand when base-exact checks finish)

_2026-11-02T19:13Z_ — handover: all work pushed; see checklist above.

_2026-11-05T13:34:27Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.
