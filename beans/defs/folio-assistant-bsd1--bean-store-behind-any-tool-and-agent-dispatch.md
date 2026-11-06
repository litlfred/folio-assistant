---
# folio-assistant-bsd1
$schema: bean/1.0.0
title: 'BEAN STORE BEHIND ANY TOOL + STATE MACHINE STARTS ANY MODEL''S AGENT: proposal (WHO Assured AI / Gemini benchmarking context)'
status: in-progress
type: feature
priority: normal
created_at: 2026-11-02T19:10:00Z
updated_at: 2026-11-06T06:30:00Z
parent: folio-assistant-yj32
issue: https://github.com/litlfred/cat-harness/issues/991
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
- [x] mark #992/#993 ready + merge when green (non-content docs) — `cat-harness#992` merged (`b56cb05`), `cat-harness#993` merged (`c648a79`), `cat-harness-tools#1414` merged.
- [x] step 6: remove git commands from bean-coordination, idle-backlog, bean-drain, continual-progress, workflow-state, process-state — merged to `main` via [`litlfred/cat-harness#1010`](https://github.com/litlfred/cat-harness/pull/1010) (`a43faa9c0f14`), alongside `selection` on `memory-note`/`memory-checkpoint`, `work-context` skill registration, and `tools/README.md` sync.
- [x] steps 2-5, 16-23.3 per proposal §5 — merged across `cat-harness-tools#1418`, `#1420`, `#1421`, `#1423`, `#1424`, `#1425`, `#1426`, `#1428`, `#1432`, `#1435`, `#1436`, `#1437`, `#1438`, `#1439`, `#1440`, `#1446` and `cat-harness#1005`, `#1011`, `#1013`, `#1014`, `#1016`.
- [ ] steps 7-12, 14-15, 23.4-27 per proposal §5 / `assured-ai-test-harness-2026-11-03.md` §9 (waiting on owner rulings Q8/Q9/Q10 or ITB harness tranche).

_2026-11-02T19:13Z_ — handover: all work pushed; see checklist above.

_2026-11-05T13:34:27Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.

_2026-11-05T14:00:00Z_ — Progress update (lane 5, subagent `06bedad5-e666-4838-9b85-0b59d61e97a5`): verified `cat-harness#992`, `cat-harness#993`, `cat-harness-tools#1414`, and steps 2-5, 16-23.3 all merged on `main`. Merged `origin/main` into `cat-harness#1010` (`claude/work-context-note-tool`), added required `selection` blocks to `tools/memory-note/memory-note.json` and `tools/memory-checkpoint/memory-checkpoint.json` (fixing `check:tools` `alternativesWithoutSelection`), completed Step 6 across `bean-coordination.md`, `bean-drain.md`, `idle-backlog.md`, `todo-manager.md`, `continual-progress.md`, `workflow-state.md`, and `process-state.md`, synced `SKILLS.md`, `AGENTS.md`, and `tools/README.md`, verified 0 findings on `check:context-leak`, `check:reference-direction`, and `retired-prose-words`, pushed `9cc0a6f46`, and marked `litlfred/cat-harness#1010` ready for review. Also inspected `cat-harness#971`/`#972`: commit 1 (`8938dfef9`, Q-BR-8 F Beans store links on 31 diagrams) was superseded by `#991` Q13 / `cat-harness#1011` and conflicts with `#1011`/`#1014`, while commit 2 (`2417d9a71`, G5 `kg-separation-*` phase split) + `sub-kg-lifecycle` wait on owner review (Q-B1-2 A) and owner card Q-B1-3.

_2026-11-06T06:30:00Z_ — Progress update (Round 2 lane 6, subagent `89613893-33b5-4a66-a6bf-a6e50c42dcb1` under parent `92bff8c9-777d-458a-a380-8dd5bf5cc0f3`): PR [`litlfred/cat-harness#1010`](https://github.com/litlfred/cat-harness/pull/1010) passed all CI checks (`Prepare the PR side (and typecheck)`, `Prepare the main side`, `head — tests and gates, shard 1/1`, `No new failures (tests and gates)`, `CodeQL`) and merged to `litlfred/cat-harness` `main` at `2026-11-06T06:29:53Z` as commit [`a43faa9c0f14`](https://github.com/litlfred/cat-harness/commit/a43faa9c0f1476a4e9287d5390d434be5b916f53) per owner ruling `Q-DRAIN-1 = Option A`.
