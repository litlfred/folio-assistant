---
# folio-assistant-vx9r
$schema: bean/1.0.0
title: 'Schema viewer vocabulary reader: cat-harness-tools#2276 (bean cat-tools-xfd4)'
status: in-progress
type: task
priority: normal
created_at: 2026-11-15T07:45:00Z
updated_at: 2026-11-15T07:45:00Z
parent: folio-assistant-v8bg
tags:
    - handover-2026-11-12
---

Workstream state for the class-model vocabulary reader. It resumes the CLI session that stalled on credits (gist f2613e4b, section "FHIR core, vocabularies, RDF reader"). That session never committed its reader, so the reader was rebuilt from the session's design.

- FHIR profiles (#2164) and FHIR core types (#2181) are merged. Bean cat-tools-t6fz is completed in #2276.
- cat-harness-tools#2276 (draft, issue #2254) adds the RDF reader over the npm `@vocabulary/*` packages (owner's choice A) and the BPMN/DMN moddle reader.
- ODRL and SPAR are reported as unreadable. schema.org waits on an owner card.
- Next: get CI green, then hand the PR to the merge manager thread. It queues behind folio-assistant#3124.
- Coordinator defaults: bean cat-tools-fc0r records that the publish step does NOT build FHIR core's definitions yet.
- Thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9ML7DLxyJX5eXJUBwAeJxeF

_2026-11-15T07:45:00Z_ — Filed, with draft PR #2276 up.
