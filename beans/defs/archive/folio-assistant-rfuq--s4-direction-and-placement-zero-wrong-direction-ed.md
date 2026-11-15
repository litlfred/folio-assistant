---
# folio-assistant-rfuq
$schema: bean/1.0.0
title: 'S4 direction and placement: zero wrong-direction edges; placement PR2-PR9; 9umr finale'
status: completed
type: task
priority: normal
created_at: 2026-10-01T08:14:34Z
updated_at: 2026-10-30T20:37:00Z
parent: folio-assistant-7x5n
---

Absorbs zlmp, yj6r, zhg2, r3gy, 2j2r, iirv pzwb/63wl/4fv8/tlat/apcg/8fq9/f8wp/p9bu, 9umr finale. Placement PRs run ONE AT A TIME.

## Done when
- [x] import-direction and reference-direction at 0 wrong-direction edges (litlfred/cat-harness-tools#938, litlfred/cat-harness#763, litlfred/folio-assistant-core#256, litlfred/fhir-harness#213)
- [x] 2j2r readers follow the checkout
- [x] placement PR2..PR9 merged (`pzwb`, `63wl`, `4fv8`, `tlat`, `apcg`, `8fq9`, `f8wp`, `p9bu` all completed and merged on `main`)
- [x] 9umr: last five tool skills out of folio-core (litlfred/cat-harness#518, litlfred/cat-harness#661; folio-assistant-9umr completed)


## Owner rulings 2026-10-01
- large-datasets -> subgraph of cat-harness. Blocker: 1 upward import (large-datasets/scripts/gen-id-lookup.ts -> folio-assistant-core/schemas/catalogue.js) + needs: folio-assistant-core.
- agent-skills -> library subgraph of cat-harness. 0 code imports from core; drop needs: folio-assistant-core.
- [x] large-datasets folded into cat-harness
- [x] agent-skills folded into cat-harness


## 2026-10-01 evidence from #1776 (S4 agent)
R5 26->0, R6 md 12->0, large-datasets core import 1->0, reference-direction 1667->1640 occurrences (381->372 files). R6 .ts x6 are emitted-file paths, not root refs. Remaining: gen-id-lookup SOURCE='who-iris' and large-datasets prose naming core; goes with the needs change.
## Owner rulings 2026-10-01 on the placement-audit questions (#1778)
Q1 watchers->sci (generic integration-watcher stays); Q2 editorial graph split; Q3 Milnor->sci, render-check split; Q4 maths pipeline split in S5; Q5 dissolve large-datasets/agent-skills into concern groups; Q6 rename skills/authoring->skills/content (PR2); Q7 core catalogue/dublin-core/fhir-artifact-index split.

Post-merge (main c7505917, #1776): reference-direction 1697 -> 1670 wrong-direction occurrences (388 -> 379 files); markdown-link scan UP 0 / ROOT 0; check:reference-direction:check green with the regenerated sidecar. No done-when box is met yet: 1670 name occurrences remain (mostly names, not links), and large-datasets/agent-skills folding waits on the needs change.

## State 2026-10-09 (post-split, measured in the index checkout at 28283d2b9f)
- `check:import-direction` → **0** wrong-direction imports in all 11 instances (156 dynamic `import(expr)` calls in 84 files are "could not determine").
- `check:reference-direction -- --findings` → **4559** wrong-direction name occurrences in 519 files (4229 from cat-harness; then fhir-harness → smart-trust 63, core → who-iris 52). Not comparable with the 1670 recorded 2026-10-01: the corpus is now the composed mount set, and 311 occurrences in 42 files are PENDING (multi-instance). Box 1 not met for references.
- Placement: PR3 `63wl`, PR5 `tlat`, PR6 `apcg` completed; PR2 `pzwb`, PR4 `4fv8`, PR7 `8fq9`, PR8 `f8wp` todo; PR9 `p9bu` in-progress. Since the split each is a cross-repository change.
- `2j2r` is completed (box 2 can be checked against it). large-datasets / agent-skills folding not re-measured. Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

_2026-10-15T16:49Z_ — Block lifted: `hx65` is completed (main green, #1774 merged). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-26T13:20:00Z_ — Progress update: Placement PR9 (`p9bu`) is now `completed` (`2026-10-24T08:52:36Z`; `cat-harness-tools#683`, `cat-harness#498`, `fhir-harness#148`, `smart-base#149`). PR2 (`pzwb`), PR7 (`8fq9`, 8/9 test groups merged), and PR8 (`f8wp`) are `in-progress`; PR4 (`4fv8`) remains `todo` (blocked by `pzwb`).

_2026-10-29T09:30Z_ — Lane A (session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo): `check:reference-direction` showed 8 wrong-direction occurrences in 4 files. litlfred/cat-harness#681 (merged) fixes the 3 cat-harness → cat-harness-tools ones by giving each reference its URL. The 5 left are cat-harness-tools → folio-assistant-core, all in `scripts/bean-dedupe.ts`, which hard-codes core as a bean store. They clear when that tool reads its stores from a declaration; that is the bean-dedupe work in cat-harness-tools#460 (Lane E). Placement PR8 (`f8wp`) schema groups 1 to 8 are merged too.

_2026-10-30T17:04:00Z_ — Boxes 1 and 4 satisfied:
- **Box 1 (`import-direction and reference-direction at 0 wrong-direction edges`):** Measured across all 11 declared instances in a composed checkout: `bun run cat check:import-direction` reports **0** wrong-direction imports across all 11 instances (3,114 files). Eliminated all remaining wrong-direction references across the 11 instances (`bean-dedupe.ts`, `gen-library-viz.ts`, `gen-schema-viz.ts`, `gen-translation-status.ts`, `viewer-declarations.ts`, `site-coverage.ts`, `kg-export.ts`, and `.github/workflows/layer-pr-checks.yml` in **litlfred/cat-harness-tools#938**; `skills/ui/ui-core/render-order.md` + `test/results/reference-direction.qa-results.json` recording `wrongDirection: 0` in **litlfred/cat-harness#763**; `skills/content/folio-document-adapter/folio-content-lifecycle.md` in **litlfred/folio-assistant-core#256**; and `fhir-harness.json`, `scripts/check-artifact-index.ts`, `scripts/check-ig-annex-links.ts`, `skills/fhir-ig-base/ig-build-pipeline.md` in **litlfred/fhir-harness#213**). With those four PRs, `bun run cat check:reference-direction` reports **0 wrong-direction in 0 files** (5,969 exempt, 0 multi-destination unlisted, 0 undetermined), `check:reference-direction -- --check` is OK, and `kg:detangle:direction` reports **0** wrong-direction edges.
- **Box 4 (`9umr: last five tool skills out of folio-core`):** `cat-harness/skills/folio-core/` was moved to `cat-harness/skills/tools/folio-core/` under the declared `tools` topic in `litlfred/cat-harness#518` and `#661` (holding `covered-is-not-reachable`, `deployment-auth`, `mcp-assembly`, `mcp-contract`, `mcp-projection`, `skills-and-tools`, `tool-authoring`), and `folio-assistant-9umr` is now `completed`.
- **Remaining (Box 3, `placement PR2..PR9 merged`):** PR3 (`63wl`), PR5 (`tlat`), PR6 (`apcg`), PR7 (`8fq9`), and PR9 (`p9bu`) are `completed`; PR2 (`pzwb`, Batch 3 merged in `cat-harness#758` + `folio-assistant-core#250`, only final gate verification checkbox remaining), PR4 (`4fv8`, all moves merged in `fhir-harness#210`, `smart-base#217`, `folio-assistant-core#242`, `folio-assistant-sci#117`, `cat-harness#747`, only final gate verification checkbox remaining), and PR8 (`f8wp`, only `uml:overview:check` checkbox remaining) are in final verification.

_2026-10-30T20:37:00Z_ — Box 3 (`placement PR2..PR9 merged`) satisfied and `folio-assistant-rfuq` completed:
- **PR2 (`folio-assistant-pzwb`):** `completed` (`folio-assistant-core#240` + `cat-harness#728`, `folio-assistant-sci#120` + `cat-harness#738`, `folio-assistant-core#250` + `cat-harness#758`; all 4 Done-when boxes verified in composed `folio-assistant` checkout at `27d72c8d91`).
- **PR3 (`folio-assistant-63wl`):** `completed` (PR #1875).
- **PR4 (`folio-assistant-4fv8`):** `completed` (`folio-assistant-core#246`, `folio-assistant-sci#123`, `fhir-harness#203` & `#204`, `cat-harness-tools#912` & `#999`, `cat-harness#747`; `process-bindings.baseline.ts` shrunk to 0).
- **PR5 (`folio-assistant-tlat`):** `completed` (PR #1886).
- **PR6 (`folio-assistant-apcg`):** `completed` (PR #1898).
- **PR7 (`folio-assistant-8fq9`):** `completed` (all 9 test concern groups regrouped in `cat-harness-tools`).
- **PR8 (`folio-assistant-f8wp`):** `completed` (all 8 schema concern groups regrouped and moved with `8lcl`, residual gate merged in `cat-harness-tools#881`, `uml:overview:check` sub-subgraph test merged in `cat-harness-tools#941`).
- **PR9 (`folio-assistant-p9bu`):** `completed` (`cat-harness-tools#683`, `cat-harness#498`, `fhir-harness#148`, `smart-base#149`).
- Re-verified on `litlfred/folio-assistant` `main` (`27d72c8d91`): `check:import-direction` reports **0 wrong-direction** across all 12 instances (3,105 files), `check:reference-direction -- --check` reports **0 wrong-direction in 0 files** (6,034 exempt), `check:process-bindings` reports **0 wrong-direction (baseline 0)**, and `kg:detangle:direction` reports **0 wrong-direction edges**.
