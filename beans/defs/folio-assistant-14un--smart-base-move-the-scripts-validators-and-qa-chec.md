---
# folio-assistant-14un
$schema: bean/1.0.0
title: 'smart-base: move the scripts, validators and qa-checkers behind L* tool nodes into their subgraph'
status: in-progress
type: task
priority: normal
tags:
    - smart-base
    - subgraphs
created_at: 2026-11-13T12:07:20Z
updated_at: 2026-11-13T21:49:00Z
parent: folio-assistant-95e7
---

## Why

Parent: `folio-assistant-95e7`. The tool declarations moved into L1–L4 (issue #359, "organize tools, skills, processes the same way"); the code they invoke did not. Examples: `L2-bpmn/tools/bpmn-to-fsh` runs `smart-base/scripts/smart-base-transform.py`; L1 tools run `smart-base/scripts/l1-*`.

| now | target |
|---|---|
| `scripts/l1-*`, `gen-l1-extraction-pages`, `extract-smart-kg-l1`, `extract-dak-l1-references`, `extractors/who-l1.py` | L1 |
| `scripts/l1-recommendation-scenarios`, `l1-scenario-vocabulary` (+ fixtures), `dth/check-l2-dth`, `l2-program-indicators.py`, `extractors/dak-requirements.py`, `dak-data-dictionary(-diff)`, `gen-dak-components-figure`, `skills/skill-definitions/l2-dak-authoring.json` | L2 |
| `scripts/visio-svg-bpmn.ts`, `qa-checkers/dak-bpmn-has-process` | L2-bpmn |
| `qa-checkers/dak-dmn-has-decision-table` | L2-dmn |
| `scripts/smart-base-transform.py` | split: bpmn2fsh → L2-bpmn, dmn2html → L2-dmn (and drop the duplicate of `input/scripts/transform_dmn.py`) |
| `scripts/terminology-lookup.ts`, `ig-site-sidecars`, `ig-dak-metadata`, `check-ig-citations`, `dak-pre-export.sh`, `tools/smart-fhir-cache-seed/` | L3 |
| `processes/content/SGAuthoring.DAKLifecycle.bpmn` | L2 (confirm) |

Harness-wide items stay at the root: `skills/content/authoring-who-smart-guidelines/*`, `skills/voices`, `tools/index.ts`, `tools/lib.ts`, `processes/content/smart-guideline-end-to-end.*`, generic `scripts/*`.

~121 files name `smart-base/scripts/…` (tool invoke strings, `package.json` `checkoutScripts`, `l1-extractions/*/run-context.json`, `.pot` files, `.github/workflows/ig-ast-refresh.yml:53`).

## Done when

- [ ] One PR per subgraph, each with every reference updated and `bun run cat split:baseline --check` unchanged.
- [x] The `smart-base-house-processes` description in `smart-base.json` lists only what is still there (it names BPMN that moved to L1, L2 and L4). (`smart-base#357` retired `smart-base-house-processes` into `collab/`, `L2/collab/` and `L3/collab/`.)
- [x] Each subgraph `graph.json` declares only directories that exist.

## Progress Notes (2026-11-13)

- **L3 subgraph slice (`litlfred/smart-base#389`, head `45632f39feaf4bfddbde5c6d7e8952ccddb85c54`):**
  - Moved `terminology-lookup.ts` (+ `.test.ts` + `.feature`), `ig-site-sidecars.ts` (+ `.test.ts` + `.feature`), `ig-dak-metadata.ts` (+ `.test.ts` + `.feature`), `check-ig-citations.ts` (+ `.test.ts` + `.feature`), and `dak-pre-export.sh` from `smart-base/scripts/` into `smart-base/L3/scripts/`.
  - Moved `smart-fhir-cache-seed.ts` from `smart-base/tools/smart-fhir-cache-seed/` into `smart-base/L3/tools/smart-fhir-cache-seed/`.
  - Declared `l3-scripts` (`path: "scripts/"`, `subgraph: true`, `graphTypologies: ["code"]`) in `smart-base/L3/graph.json` and updated `l3-tools` description.
  - Updated all callers (`smart-base/package.json`, `smart-base/L3/tools/terminology-lookup/terminology-lookup.ts`, `smart-base/scripts/l1-scenario-vocabulary.ts`, `smart-base/scripts/extract-dak-l1-references.ts`, `smart-base/scripts/tests/fhir-cache-seed-publisher-sites.test.ts`, `smart-base/L3/skills/smart-l3/dak-postprocessing.md`, `smart-base/L3/skills/smart-l3/dak-preprocessing.md`, `smart-base/L1/skills/smart-l1/classify-and-code-content.md`, `smart-base/glossary/generated/smart-base/kg-tools.glossary.json`, and generated `README.md` files via `subgraph-readmes.ts`).
  - Verified 61/61 unit tests pass across all 7 affected test files and `readme:subgraphs --check` is `0 stale`.
  - Queued for Merge Manager (`ready-to-merge` label + `ready: 45632f39feaf4bfddbde5c6d7e8952ccddb85c54` comment `#issuecomment-6865711601`, session `https://claude.ai/code/session_01R25Lane6SmartBaseL3Subgraph`, per owner instruction not to direct-merge).
- **Remaining slices (`todo`):** L1 (`scripts/l1-*`, `gen-l1-extraction-pages`, `extract-smart-kg-l1`, `extract-dak-l1-references`, `extractors/who-l1.py`), L2 (`l1-recommendation-scenarios`, `l1-scenario-vocabulary`, `dth/check-l2-dth`, `l2-program-indicators.py`, `extractors/dak-requirements.py`, `dak-data-dictionary(-diff)`, `gen-dak-components-figure`, `skills/skill-definitions/l2-dak-authoring.json`, `SGAuthoring.DAKLifecycle.bpmn`), L2-bpmn (`visio-svg-bpmn.ts`, `qa-checkers/dak-bpmn-has-process`, `smart-base-transform.py` bpmn2fsh), L2-dmn (`qa-checkers/dak-dmn-has-decision-table`, `smart-base-transform.py` dmn2html).
