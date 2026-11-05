---
# folio-assistant-akiq
$schema: bean/1.0.0
title: Derive builtAtPublish entries for foreign BPMN drawings instead of hand-listing them
status: todo
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T11:35:43Z
updated_at: 2026-11-05T11:35:43Z
parent: folio-assistant-k3vv
---

Follows bean folio-assistant-3v2t (cross-layer derived files are built at publish) and bean folio-assistant-tsh9 (red-main cycle).

## Evidence
- Main stayed red on `render:bpmn:check` (e2e shard 1/3, run 42012108138). The new fhir-harness diagram `processes/tools/ig-docs-site-compose.bpmn` was drawn into `cat-harness/docs/assets/img/workflows/`, but cat-harness.json `builtAtPublish` hand-lists every foreign drawing (`because: "checkout"`, about 50 lines) and was missing this one. So publish-check called the new SVG a committed artefact that moved.
- Stopgap: litlfred/cat-harness#1041 adds the one line.
- Root cause: a lower layer adding a diagram needs a matching hand edit in cat-harness, which only shows up after the re-pin, on folio-assistant main (bean tsh9's cross-pin cycle, bean 3v2t).

## Fix
Derive the entries instead of listing them. For `render:bpmn`, every drawing whose `.bpmn` lives in another instance is built at publish by rule, keyed on the source's instance and not on a list. Candidate places:
- `declaredPlan` in cat-harness-tools/scripts/derive-at-publish.ts adds the derived entries for the writer, or
- one declared pattern entry (e.g. `"foreign": true` on a directory entry) that publish-check and `judge` both read.
Then drop the hand-listed lines.

## Done when
- A new `.bpmn` in any lower layer, re-pinned into folio-assistant, leaves `render:bpmn:check` green with no cat-harness edit.
- A test covers it: a fixture instance adds a diagram and the check passes.
