---
# folio-assistant-3vk4
$schema: bean/1.0.0
title: 'Memory: Never declare a builtAtPublish path "for the future": derive:publish fails a declared artefact built empty, and only train stage jobs catch it'
status: completed
type: task
priority: low
created_at: 2026-11-08T09:09:26Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `builtatpublish-declare-only-built.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Never declare a builtAtPublish path "for the future": derive:publish fails a declared artefact built empty, and only train stage jobs catch it


smart-trust-phw#33 (merged 2026-11-08 07:44Z) declared `fhir-artifact-index/contexts/` in `smart-trust-phw.json` builtAtPublish for a JSON-LD context the IG might add later. That IG builds nothing there, so `derive:publish` failed train fa#3036's stage job with "declared built at publish, and ig-index:build built nothing there". The PR's own CI was green. The fix was smart-trust-phw#52, which dropped the entry (merged 09:04Z).

**Why:** derive:publish runs only in the train's Feature Staging job, not in a layer's PR checks.
**How to apply:** declare only outputs the writer builds today. Add the entry in the same PR that adds the source. See [[merge-master-2026-11-08]].
