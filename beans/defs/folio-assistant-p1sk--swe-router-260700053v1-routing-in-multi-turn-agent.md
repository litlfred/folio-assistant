---
# folio-assistant-p1sk
$schema: bean/1.0.0
title: 'SWE-Router (2607.00053v1): routing in multi-turn agentic SE — cost-aware model choice per task'
status: completed
type: task
created_at: 2026-10-02T23:15:27Z
updated_at: 2026-10-09T17:15:20Z
parent: folio-assistant-0ipy
---

Ingest + critical analysis. 10pp. Pairs with TCAndon-Router; bears on when a swarm needs a frontier model at all.

## Closed 2026-10-09

Resolved on branch `claude/p1sk-swe-router-ingest` (commit `15e17891e6748fec5943a2653a8726d0f2aa1882` pushed to origin).

### Deliverables & Evidence
1. **Library Ingest**:
   - Ingested `uploads/arxiv-2607.00053v1/arxiv-2607.00053v1.pdf` into `library/arxiv-2607.00053v1/` via `scripts/ingest-document.ts`.
   - Manifest (`manifest.jsonld`), document structure (`structure.json`, 24 sections, 24 blocks), sections (`sections/*.md`, `sections/*.jsonld`), and blocks (`blocks/*.jsonld`) promoted cleanly.
   - Evaluated figures and raster images: recorded verdicts in `library/image-verdicts.json` for raster drop-shadow components (`img-p002-1`, `img-p002-2` as decorative) and vector diagram renders (`vfig-p002` Figure 1 overview, `vfig-p004` Figure 2 Pareto curve).
   - Generated `library/arxiv-2607.00053v1/README.md`.
   - Verified L1 completeness via `bun run scripts/check-l1-complete.ts library/arxiv-2607.00053v1` (all required gates passed).

2. **Integration with `swarm-management`**:
   - Updated `skills/sdlc/sdlc-core/swarm-management.md` with §"Cost-aware dynamic routing (SWE-Router / 2607.00053v1)".
   - Incorporated core findings:
     - Bayes-error floor of static prompt-only routers and why multi-turn agentic SWE requires trajectory conditioning.
     - Value-based temporal routing policy: $K$-step exploration budget with lightweight model $m_1$, value estimator $\hat{r}_1(T_{\le K})$, and cost-adjusted threshold $\lambda''$.
     - Clean escalation rule: restarting frontier model $m_2$ from clean prompt $q$ to avoid context poisoning from $m_1$'s false assumptions.
     - Cost-performance Pareto trade-offs and decision matrix specifying when a swarm subtask warrants frontier vs lightweight models.

3. **Test & Quality Verification**:
   - `bun run typecheck`: clean (0 errors).
   - Library test suite (`scripts/tests/library-document.test.ts`, `library-links.test.ts`, `library-graph-instance.test.ts`, `library-withheld.test.ts`, `library-refscan-reproducible.test.ts`, `library-withheld-view.test.ts`): 40 passed, 0 failed.
   - Skill test suite (`scripts/tests/skill-contracts.test.ts`, `skill-coverage.test.ts`, `skill-governance.test.ts`, `skill-manifest-coverage.test.ts`, `skill-refs.test.ts`, `skill-topics.test.ts`): 30 passed, 0 failed.
