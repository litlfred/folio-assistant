---
# folio-assistant-ntyj
title: 'PHASE P2: JSON-only — every dropped XML/Turtle representation recorded as a refusal, per IG and combined'
status: todo
type: feature
created_at: 2026-10-01T12:32:21Z
updated_at: 2026-10-01T12:32:21Z
parent: folio-assistant-uhkv
blocked_by:
    - folio-assistant-qrnz
---

Phase P2 of `ig-publisher-reduction` (approved 2026-09-30). Opened in the 2026-10-01 phased-transition review.

**Exit criterion:** every dropped representation is **recorded as a refusal**, per IG with P1's combined view, so that "publishes no Turtle" and "we ignored its Turtle" stay distinguishable.

**State:** the per-artefact data is already present. `fhir-artifact-index` records each artefact's published json/xml/ttl/html. smart-trust: 678 artefacts, and the Publisher has 2,004 representation views (668 each of json/xml/ttl, measured in `jut3`'s parity table).

**Blocked by `qrnz`** for the combined view. The smart-trust refusal record and the JSON view pages are built under `jut3` (parity step 4).

## Done when
- [ ] a refusal record per IG: which XML/TTL representations the Publisher published that this pipeline does not render
- [ ] the JSON view pages render for every artefact with a JSON representation
- [ ] the combined report across at least 2 IGs (after `qrnz`)
