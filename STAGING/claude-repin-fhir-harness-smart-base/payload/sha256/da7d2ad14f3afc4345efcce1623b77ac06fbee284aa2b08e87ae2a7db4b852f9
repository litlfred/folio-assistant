---
# folio-assistant-o57z
$schema: bean/1.0.0
title: 'SWE-Debate (2507.23348v1): competitive multi-agent debate — refine devils-advocate-watcher and the adjudication codes'
status: completed
type: task
created_at: 2026-10-02T23:15:27Z
updated_at: 2026-10-09T19:26:00Z
parent: folio-assistant-0ipy
---

Ingest + critical analysis. 19pp. Bears on devils-advocate-watcher, the accepts/adjudication codes (bean bvuk), and whether debate beats a single adversarial pass.

## Closed 2026-10-09

- **Branch:** `claude/o57z-swe-debate-ingest` in `cat-harness`
- **Commit:** `6ee05b0186e02a2d4cd2229a79cac9324347cda9`
- **Ingestion:** Full L1 ingestion of arXiv:2507.23348v1 ("SWE-Debate: Competitive Multi-Agent Debate for Software Issue Resolution", 19pp) into `library/arxiv-2507.23348v1/` with 31 sections, 31 blocks, 115 raster glyphs classified as decorative, and 4 vector figures inspected with narratives in `library/image-verdicts.json` (`vfig-p003` Fig 1, `vfig-p004` Fig 2, `vfig-p008` Fig 3, `vfig-p009` Fig 4).
- **Critical Analysis & Integration:**
  - `skills/authoring/authoring-core/devils-advocate-watcher.md`: Added §"Competitive multi-agent debate and structured adjudication (SWE-Debate / 2507.23348v1)" addressing limited observation scope, false positives (symptom attack like Django-11999) vs false negatives (local plausibility masking), optimal reasoning chain depth $L \le 5$, elevation triggers (headline proximity, multi-lens divergence, multi-hop ambiguity), and the 3-round competitive debate protocol.
  - `schemas/adjudication.ts`: Implemented `DebateCritiqueSchema`, `DebateProposalSchema`, `DebateRoundSchema`, and `AdjudicationDebateSchema` ("swe-debate-v1"); integrated debate audit records into `AdjudicationOutcomeSchema.debate`; added round sequence validation in `adjudicationDefects`.
- **Verification Evidence:**
  - `bun run scripts/check-l1-complete.ts library/arxiv-2507.23348v1`: All L1 criteria pass (`✓`).
  - `bun test schemas/adjudication.test.ts`: 11 pass, 0 fail.
  - `bun test scripts/tests/adjudication-marker.test.ts`: 41 pass, 0 fail.
  - `bun run typecheck`: TypeScript passes cleanly (0 errors).

