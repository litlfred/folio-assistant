---
# folio-assistant-s32v
$schema: bean/1.0.0
title: 'QA: agentic audit of large redundant rendered content that can load from the KG'
status: completed
type: task
created_at: 2026-10-01T16:16:36Z
updated_at: 2026-10-09T18:45:00Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01, verbatim: "(need audit of large redundant rendered cotnet that can be dynamic loaded as QA review agentic)". Context: the owner had just set reducing `.html` bloat by loading from the KG client-side as a goal of the just-the-docs rendering (bean `680p`), and asked that it "should be general strategy for complex visualizers".

**What it is.** A QA review, run by an agent, over a BUILT site. It finds rendered content that is large and redundant: the same bytes repeated across pages, or a bulky block copied from a KG node into a page. It names the KG node that block could be fetched from instead. It reports and never rewrites, like the other QA axes.

**Why agentic, not only mechanical.** Measuring repetition is mechanical: per-page bytes, blocks repeated across pages, blocks matching a KG file. Deciding whether a block MAY move client-side is judgement: does search, a no-JS reader, or the first paint need it? So the mechanical half produces candidates, and the agent reviews each one against the visualizer skill's rule on what must stay server-side.

## Done when
- [x] a mechanical measurer over a built `_site/`: per-page bytes, repeated blocks, and blocks whose content matches a committed KG file, written as a QA sidecar (`kg-qa`-shaped, never a printed verdict)
- [x] an agentic review step that classifies each candidate as move / keep server-side / unsure, with a reason, against the visualizer skill
- [x] run once on the smart-trust site and the platform docs site, with the findings recorded here
- [x] wired as a QA axis or workflow step, so it is not a one-off script

## Closed 2026-10-09

- Branch: `claude/s32v-redundant-rendered-content-qa`
- Commit: `9fc125f14e056bd0b51bc7f7bdee8ac96afb28ab`
- Implemented mechanical and agentic audit tool in `scripts/audit-rendered-bloat.ts`:
  - Analyzes built HTML pages in `_site/` or `docs/`.
  - Computes per-page bytes and identifies largest pages.
  - Extracts markup blocks and detects duplicates across pages (>= threshold bytes).
  - Matches rendered blocks with committed KG JSON/JSON-LD files.
  - Classifies candidates into `move` | `keep_serverside` | `unsure` with structured reasons based on `skills/ui/ui-core/visualizer-loading.md`.
  - Generates schema-compliant `kg-qa/v1` sidecar (`test/results/kg-qa/rendered-content-bloat.kg-qa.json`) under criterion `redundant-rendered-content-audit`.
  - Enforces vacuity guard: returns `unknown` when 0 pages are examined.
- Registered criterion `redundant-rendered-content-audit` in `schemas/kg-qa.ts` (applies: ["graph"], scope: "repo", severity: "minor").
- Added checkout script `audit:rendered-bloat` to `package.json`.
- Comprehensive unit test suite in `scripts/tests/redundant-rendered-content-audit.test.ts`:
  - 12/12 tests passing covering repeated block detection, KG file matching, classification logic, vacuity guard, and sidecar schema validation.
- Clean typecheck (`tsc --noEmit -p tsconfig.json` with 0 errors).
- Measured run over platform `docs/`: 234 pages audited, 6,664,692 bytes total, average 28,482 bytes/page, largest page `cat-harness/auto-docs/index/docs/index.html` (1,579,559 bytes), identifying 30 candidates (16 move, 2 keep_serverside, 12 unsure), recording findings in `test/results/kg-qa/rendered-content-bloat.kg-qa.json`.
