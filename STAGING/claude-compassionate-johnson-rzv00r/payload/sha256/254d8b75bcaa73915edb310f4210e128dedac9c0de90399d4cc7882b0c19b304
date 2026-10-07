---
# folio-assistant-ntyj
title: 'PHASE P2: JSON-only — every dropped XML/Turtle representation recorded as a refusal, per IG and combined'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-01T12:32:21Z
updated_at: 2026-10-02T18:00:38Z
parent: folio-assistant-uhkv
---

Phase P2 of `ig-publisher-reduction` (approved 2026-09-30). Opened in the 2026-10-01 phased-transition review.

**Exit criterion:** every dropped representation is **recorded as a refusal**, per IG with P1's combined view, so that "publishes no Turtle" and "we ignored its Turtle" stay distinguishable.

**State:** the per-artefact data is already present. `fhir-artifact-index` records each artefact's published json/xml/ttl/html. smart-trust: 678 artefacts, and the Publisher has 2,004 representation views (668 each of json/xml/ttl, measured in `jut3`'s parity table).

**Blocked by `qrnz`** for the combined view. The smart-trust refusal record and the JSON view pages are built under `jut3` (parity step 4).

## Done when
- [x] a refusal record per IG: which XML/TTL representations the Publisher published that this pipeline does not render
- [x] the JSON view pages render for every artefact with a JSON representation
- [ ] the combined report across at least 2 IGs (smart-trust and smart-immunizations, both ingested)

## Owner ruling 2026-10-01: every phase renders equivalent to the standard IG render

In the owner's words: *"each phase needs to render equivalent to existing IG standard render"*.

This is an invariant across **all** phases, not just P0's exit criterion. Whatever a phase changes in the pipeline, its output must stay equivalent to the IG Publisher's standard render of the same IG. The measured reference is `jut3`'s parity table: the Publisher's page set, by page kind.

**Open tension, put to the owner:** P2 as approved drops XML/Turtle ("recorded as a refusal"). Under this invariant, a refused representation is a difference from the standard render.

## Owner ruling 2026-10-01: P2 kept as approved

In the owner's words: *"Keep P2 as approved: drop XML and Turtle, and treat the refusal record as an accepted"*, the option offered as *"…accepted, documented difference from the standard render"*.

- XML and Turtle representation views (1,331 pages on smart-trust) are **not rendered**.
- Each one is recorded as a refusal. That record is the **accepted, documented exception** to the cross-phase rule that every phase renders equivalent to the standard IG render.
- JSON views remain in scope (673 pages).

## 2026-10-01: per-IG refusal record, and the JSON views

**Refusal record.** `fhir-harness/scripts/p2-refusals.ts` is generic: it reads an instance's artefact index and writes `<instance>/test/results/p2-refusals.qa-results.json` (`qa-results/v1`).
- **Families.** `xml` and `ttl` list every representation the IG published and this pipeline refuses. Each entry gives the Publisher's URL, its view page, and the ruling. `not-published` lists artefacts with no XML or no Turtle at all, so their absence is a fact about the IG, not a gap in the record.
- **Gate.** `p2:refusals` / `p2:refusals:check` run in `code-quality-gates.yml` beside the page checks.
- **smart-trust:** 678 XML and 678 Turtle refused, 0 not published. Reconciled against the fork's `gh-pages`, the record names exactly the Publisher's **1,354** XML/TTL view pages, including 5 `.profile` ones for StructureDefinitions. The ImplementationGuide's files are published with no view page and are recorded without one.
- **smart-base:** 162 + 162 refused, and 63 artefacts with a representation the IG did not publish. Its index dates from 2026-09-22 (bean `wnhh`).

**JSON views:** 672 of 672 equivalent in Chromium (see `jut3`).

**Still open:** the combined report across at least two IGs. It needs the second IG (`qrnz`), so `blocked_by` stands for that item only.



## 2026-10-02: unblocked
The second IG landed: `qrnz` is completed, and smart-immunizations is ingested at `smart-immunizations/fhir-artifact-index/`. The combined report is now ordinary work, no longer blocked, so the Done-when names the two IGs instead of the closed bean (`check:stale-paths`).
