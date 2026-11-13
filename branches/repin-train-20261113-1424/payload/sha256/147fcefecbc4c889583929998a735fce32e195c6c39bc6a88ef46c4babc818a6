---
# folio-assistant-14un
$schema: bean/1.0.0
title: 'smart-base: move the scripts, validators and qa-checkers behind L* tool nodes into their subgraph'
status: todo
type: task
priority: normal
tags:
    - smart-base
    - subgraphs
created_at: 2026-11-13T12:07:20Z
updated_at: 2026-11-13T12:07:20Z
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
- [ ] The `smart-base-house-processes` description in `smart-base.json` lists only what is still there (it names BPMN that moved to L1, L2 and L4).
- [ ] Each subgraph `graph.json` declares only directories that exist.
