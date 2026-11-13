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
updated_at: 2026-11-13T22:35:00Z
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

- [x] One PR per subgraph (`litlfred/smart-base#383`, `litlfred/smart-base#384`, `litlfred/smart-base#385`, `litlfred/smart-base#387`, `litlfred/smart-base#389`), each with every reference updated and `bun run cat split:baseline --check` unchanged.
- [x] The `smart-base-house-processes` description in `smart-base.json` lists only what is still there (it names BPMN that moved to L1, L2 and L4). (`smart-base#357` retired `smart-base-house-processes` into `collab/`, `L2/collab/` and `L3/collab/`.)
- [x] Each subgraph `graph.json` declares only directories that exist.

## Progress Notes (2026-11-13)

- **L1 subgraph slice (`litlfred/smart-base#383`, branch `claude/l1-scripts-into-subgraph`, head `5d87920169f6e914f35cd6f0bf99594d221ae71a`, merged to `main` at `3b24de2`):**
  - Moved the L1 extraction scripts (`l1-recommendation-candidates`, `l1-table-candidates`, `l1-transcription-verbatim`, `l1-statement-lists`, `l1-indicator-sheets.py`, `l1-run-context`, `l1-kgid`, `l1-extraction-declared.test`, `gen-l1-extraction-pages`, `extract-smart-kg-l1`, `extract-dak-l1-references`) into `smart-base/L1/scripts/` (`l1-scripts` in `smart-base/L1/graph.json`). Left `scripts/extractors/who-l1.py` at `<instance-root>/scripts/extractors/` because `cat-harness-tools/scripts/extract-candidates.py` discovers extractors at `<instance-root>/scripts/extractors/*.py` only.
- **L2 subgraph slice + L1→L2→L3 `requires` chain (`litlfred/smart-base#384`, branch `claude/l2-scripts-into-subgraph`, head `00db30e0e6d60dd9982ad6f09aff4fc07d972408`, and `litlfred/smart-base#387`, branch `claude/l-chain-requires`, head `26fc00ddbf724da8b4a4bc12720436812bf78fdc`; supersedes `#390`, which was closed):**
  - `#384`: Moved L2-only scripts (`dak-data-dictionary.{ts,test.ts,feature}`, `dak-data-dictionary-diff.{ts,test.ts,feature}`, `dth/check-l2-dth.{ts,test.ts,feature}`) into `smart-base/L2/scripts/` (`l2-scripts` in `smart-base/L2/graph.json`) and moved `skills/skill-definitions/l2-dak-authoring.json` into `smart-base/L2/skills/skill-definitions/l2-dak-authoring.json` (`package: "smart-l2"`). Documented why `extractors/dak-requirements.py` (`extract-candidates.py` discovery), `gen-dak-components-figure.*` (pinned SVG header in `cat-harness`), `l1-recommendation-scenarios.*` / `l1-scenario-vocabulary.ts` / `l2-program-indicators.py` (reached by L1 skills/tests), and `SGAuthoring.DAKLifecycle.*` (already in root `collab/processes/content/` from `#357`) remain outside `L2/scripts/`.
  - `#387`: Added `requires: ["smart-base.smart-base-L1"]` on `smart-base-L2` and `requires: ["smart-base.smart-base-L2"]` on `smart-base-L3` in `smart-base/smart-base.json`, and moved `recommendation-scenarios.md` and `schemas/skills/recommendation-scenarios/` from `L2/` into `L1/` (resolving `check:optin-refs` for `L1/processes/classify-and-code-content.bpmn`).
- **L2-bpmn / L2-dmn subgraph slice (`litlfred/smart-base#385`, branch `claude/l2-bpmn-dmn-scripts-into-subgraph`, head `bbff1130c19ec266d43ea6415a2f0feff2cfce7c`):**
  - Moved `visio-svg-bpmn.{ts,test.ts,feature}` into `smart-base/L2-bpmn/scripts/` (`l2-bpmn-scripts` in `smart-base/L2-bpmn/graph.json`). Documented why `qa-checkers/dak-bpmn-has-process.json`, `qa-checkers/dak-dmn-has-decision-table.json` (`loadContributions` reads instance-root `qa-checkers/` only) and `scripts/smart-base-transform.py` (coupled CLI invoked by `dak-pre-export.sh`) remain in place.
- **L3 subgraph slice (`litlfred/smart-base#389`, branch `claude/l3-scripts-and-tools-subgraph`, head `c2c07f8d59231a2ed5fa120e7cbeef08a135cda6`):**
  - Moved `terminology-lookup.ts` (+ `.test.ts` + `.feature`), `ig-site-sidecars.ts` (+ `.test.ts` + `.feature`), `ig-dak-metadata.ts` (+ `.test.ts` + `.feature`), `check-ig-citations.ts` (+ `.test.ts` + `.feature`), and `dak-pre-export.sh` from `smart-base/scripts/` into `smart-base/L3/scripts/` (`l3-scripts` in `smart-base/L3/graph.json`), and moved `smart-fhir-cache-seed.ts` into `smart-base/L3/tools/smart-fhir-cache-seed/`.
- `#383` is merged to `main` (`3b24de2`); `#384`, `#385`, `#387`, and `#389` are green on fast-tier CI, have `ready-to-merge` + `ready: <sha>` + `merge-guard: success`, and are queued for the Merge Manager.
