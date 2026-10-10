---
# folio-assistant-9k2i
$schema: bean/1.0.0
title: 'CROSS-PAPER synthesis + adversarial pass ON folio-assistant: what transfers, what is refuted, what gap remains'
status: completed
type: task
created_at: 2026-10-02T23:15:27Z
updated_at: 2026-10-09T18:05:00Z
parent: folio-assistant-0ipy
---

Depends on the five per-paper beans. Must keep measured / recommended / claimed apart, as methodologies/merge-queue.md does. Adversarial in both directions: attack the papers' claims, and attack this repo's processes with them.

## Closed 2026-10-09

Synthesized the five foundational agentic SE papers (arXiv:2404.04834v4, arXiv:2507.23348v1, arXiv:2607.00053v1, arXiv:2601.04544v1, arXiv:2402.02172v5) into a comprehensive cross-cutting methodology node (`methodologies/agentic-se-literature-synthesis.md`), enforcing strict tripartite epistemic segregation (Measured vs. Recommended vs. Claimed) and executing a bidirectional adversarial pass between the literature and folio-assistant's 69 BPMN/DMN processes.

- **Commit**: `b1b7b34e32e4c5359fdb40d3976bde9d072806b4`
- **Branch**: `claude/9k2i-cross-paper-synthesis` on `git@github.com:litlfred/cat-harness.git`
- **Artifacts Produced & Updated**:
  - `methodologies/agentic-se-literature-synthesis.md`: Formal methodology conforming to `folio-methodology/v1` citing all 5 ingested library sources, structured into:
    1. Cross-cutting agentic SE landscape across the 5 pillars (He et al., SWE-Debate, SWE-Router, TCAndon-Router, CodeAgent);
    2. Epistemic partition matrix strictly isolating Measured empirical metrics, Recommended heuristics, and Claimed hypotheses;
    3. Direction 1 Adversarial Pass attacking the papers: circular human annotation in CodeAgent (auditing only flagged samples, 48.58% FP in GPT-4, LLM formatting waste), quadratic token explosion and judge bias in SWE-Debate ($L>5$ noise cliff), value-head calibration sensitivity and cold-start $K=3$ overhead in SWE-Router, static domain assumptions and synthetic training bias in TCAndon-Router, and conversational state degeneration in He et al. (ChatDev 9/10 Tetris failure);
    4. Direction 2 Adversarial Pass attacking folio-assistant: context saturation across 69 BPMN/DMN XML diagrams in agent prompts, context poisoning in swarm dispatch (violating clean escalation), merge queue fragility (enforcing owner's 2026-10-02/10-03 ruling separating deterministic compile gates from warn-only agentic reviews), and programmatic Andon-cord predicates preventing zombie agent runs;
    5. Architectural transfer matrix detailing what transfers, what is refuted, and remaining gaps;
    6. Practical implementation checklist for agents and swarm stewards.
  - `skills/sdlc/sdlc-core/swarm-management.md`: Cross-referenced `agentic-se-literature-synthesis.md` for swarm economics, clean escalation, difficulty-matched routing, and Andon-cord stopping.
  - `skills/sdlc/sdlc-core/coordinate.md`: Cross-referenced `agentic-se-literature-synthesis.md` under SDLC multi-agent landscape and coverage.
- **Verification Evidence**:
  - `bun scripts/check-methodology-evidence.ts`: Clean pass (22 of 25 methodologies verified with ingested sources; all 5 sources for `agentic-se-literature-synthesis` verified).
  - `bun test scripts/tests/skill-*.test.ts`: Clean pass (54/54 tests passing across 9 files).
  - `bun run typecheck`: Clean pass (0 errors).
