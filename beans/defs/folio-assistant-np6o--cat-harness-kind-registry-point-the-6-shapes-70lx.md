---
# folio-assistant-np6o
$schema: bean/1.0.0
title: 'cat-harness kind registry: point the 6 shapes 70lx moved at ''cat-harness-tools:<path>#Export''; map folio-slice-sqlite/v1, folio-slice-index/v1, qa-script/v1'
status: in-progress
type: task
created_at: 2026-10-11T07:00:59Z
updated_at: 2026-10-11T15:35:00Z
parent: folio-assistant-ml9h
---

Owner ruling 2026-10-11 ~06:55 UTC: **Point at tools** — the 'cat-harness-tools:<path>#Export' form the registry already uses for models (bootstrap-tools:schemas/model-registry.ts#ModelRegistrySchema). check:kind-validators:require-all at #2529's pins: folio-qa-graph/v1, folio-translation-index/v1, folio-workflow-instance/v1 (x2), folio-image-verdicts/v1, folio-issue-mark/v1 name files no longer under cat-harness; three families unmapped.

## Done when
- [x] the six shapes name their cat-harness-tools location
- [x] the three unmapped families are mapped or declared with a reason
- [ ] check:kind-validators:require-all green at #2529's pins — exits 0 locally with both halves; waits on #2529 re-pinning tools ≥ the #126 merge

## Progress 2026-10-11 15:35 UTC
Merged: cat-harness#152 (765cbed — registry names cat-harness-tools:<path>#Export; validators/slice-index.json, validators/qa-script.json) and cat-harness-tools#126 (SliceIndexSchema; qa-script/v1 in the test's qa list).
