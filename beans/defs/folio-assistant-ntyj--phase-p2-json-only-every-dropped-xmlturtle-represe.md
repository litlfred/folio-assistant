---
# folio-assistant-ntyj
title: 'PHASE P2: JSON-only — every dropped XML/Turtle representation recorded as a refusal, per IG and combined'
status: todo
type: feature
priority: normal
created_at: 2026-10-01T12:32:21Z
updated_at: 2026-10-01T12:35:15Z
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

## Owner ruling 2026-10-01: every phase renders equivalent to the standard IG render

In the owner's words: *"each phase needs to render equivalent to existing IG standard render"*.

This is an invariant across **all** phases, not just P0's exit criterion. Whatever a phase changes in the pipeline, its output must stay equivalent to the IG Publisher's standard render of the same IG. The measured reference is `jut3`'s parity table: the Publisher's page set, by page kind.

**Open tension, put to the owner:** P2 as approved drops XML/Turtle ("recorded as a refusal"). Under this invariant, a refused representation is a difference from the standard render.
