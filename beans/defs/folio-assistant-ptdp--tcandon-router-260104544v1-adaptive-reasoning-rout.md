---
# folio-assistant-ptdp
title: 'TCAndon-Router (2601.04544v1): adaptive reasoning router — does it refine swarm-management''s model-level choice?'
status: completed
type: task
created_at: 2026-10-02T23:15:27Z
updated_at: 2026-10-09T17:15:00Z
parent: folio-assistant-0ipy
---

Ingest + critical analysis. 16pp, Tencent. Bears on swarm-management (agent count, model level, cost) and dispatch-agent.

## Summary & Critical Analysis

Ingested arXiv:2601.04544v1 ("TCAndon-Router: Adaptive Reasoning Router for Multi-Agent Collaboration", 16pp, Tencent Cloud Andon).

TCAndon-Router (TCAR) addresses task-based routing in multi-agent systems where domain overlaps, multi-intent queries, and ambiguous descriptions create agent conflicts ($|A_q| > 1$). Traditional single-label routing fails under ambiguity. TCAR solves this through:
1. Dynamic agent onboarding: Agent descriptions are natural language prompts; new agents are onboarded without retraining.
2. Reason-then-select: Router generates an explicit natural-language reasoning chain (`<Reason>`) before selecting a candidate agent subset.
3. Multi-agent execution + Refining Agent: Selected candidate agents run in parallel ($F(\{r_{ij}\})$), and a downstream Refining Agent synthesizes partial perspectives into a unified answer.
4. Two-stage SFT + RL: Supervised fine-tuning on Qwen3-4B-Instruct-2507 followed by DAPO reinforcement learning with set-precision, coverage, and length penalties. Slerp model merging enhances RL initialization entropy.
5. Andon-cord stopping: Explicit handling of out-of-scope tasks (`oos` tag) and early halting on failure signals.

### Refinement to `swarm-management`
Updated `skills/sdlc/sdlc-core/swarm-management.md` with §"Adaptive reasoning routing and Andon-cord stopping (TCAndon-Router / 2601.04544v1)":
- **Adaptive reasoning routing:** Difficulty-matched reasoning depth and model tier allocation. Simple consultation tasks require low reasoning depth and a single small worker (no swarming needed, 27.0% TCAR win rate). Complex troubleshooting tasks require deep reasoning rationales and candidate subsets (empirically ~1.4 agents) unified by a downstream Refining Agent (63.0% win rate).
- **Andon-cord early termination:** Explicit stopping conditions for swarms when structural divergence, missing prerequisites/out-of-scope context (`oos`), circular deliberation loops, or shared state deadlock are detected, preventing wasteful token expenditure.

## Closed 2026-10-09

Fixed and ingested in `cat-harness` commit `333ab0d4` on branch `claude/ptdp-tcandon-router-ingest`:
- Ingested paper into `library/arxiv-2601.04544v1/` with 38 sections, 21 blocks, 3 image entries, vector figure annotations, licence statement, structure, and generated README.
- Added image and vector figure inspection verdicts to `library/image-verdicts.json`.
- Updated `skills/sdlc/sdlc-core/swarm-management.md` with §"Adaptive reasoning routing and Andon-cord stopping (TCAndon-Router / 2601.04544v1)".
- Verified all L1 completion criteria with `scripts/check-l1-complete.ts`.

Verification evidence:
- `bun scripts/check-l1-complete.ts library/arxiv-2601.04544v1`: clean pass (11 child nodes, all declared and valid).
- `bun test scripts/tests/library-*.test.ts scripts/tests/skill-*.test.ts`: 121 pass, 0 fail across 17 test files (835 expect calls).
- `bun run typecheck`: clean exit 0 (`tsc --noEmit -p tsconfig.json`).
- Git commit: `333ab0d4` on `claude/ptdp-tcandon-router-ingest`, pushed to origin.
