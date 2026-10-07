---
# folio-assistant-cpmo
title: 'SMART-BASE CROSSWALKS: the v1 to v2 ConceptMaps exist, are draft, and one is incomplete'
status: completed
type: task
priority: normal
created_at: 2026-09-22T09:06:44Z
updated_at: 2026-10-03T15:59:20Z
parent: folio-assistant-2yyh
---

The owner, 2026-09-22: *"See smart-base for more info on classications and mappings better 1 and 2..."*, then chose to have the crosswalks ingested.

## Summary of Changes

`smart-base/fhir-artifact-index/` — the published IG's artefact index, reconstructed by `ingest:ig` from `smart.who.int.base` v0.3.0 (FHIR 4.0.1), the same shape `smart-trust` and `smart-immunizations` are on.

**225 artefacts known, 47 materialized.** The materialized set is the DAK API surface — 47 JSON Schemas, 47 OpenAPI, 22 displays, 22 JSON-LD — on the same reasoning as `smart-trust`: those have no other home, and the resource JSON does.

`ingest:ig:check:smart-base` added to `package.json`, mirroring the `smart-trust` entry, so the index is a REGENERABLE graph rather than a snapshot nobody can re-derive. Nothing under it is authored; a hand-edit is a defect the next check overwrites or reports.

## Four crosswalks, not two

The survey found two. The published IG has **four** ConceptMaps, all now indexed:

| id | what it is |
|---|---|
| `CDHIv1toCDHIv2` | the intervention crosswalk between editions |
| `CDSCv1toCDSCv2` | the system-category crosswalk |
| `CDHIv1Hierarchy` | edition 1's parent-child structure |
| `CDHIv2Hierarchy` | edition 2's parent-child structure |

The two hierarchy maps were not in the FSH survey's scope and are the more reusable half: a hierarchy expressed as a ConceptMap is what lets a code be rolled up to its parent without re-deriving the tree from dotted notation.

## They are `referenced`, and that is the right state rather than a shortfall

The index says where each crosswalk is and holds **none of its rows**. Materializing one is not a flag on this script — it is `materialize-remote.bpmn`: a purpose (`working` or `archival`), then the five gates, then the fetch. `library-ingestion` places that on `folio-assist-core` deliberately, because what materialization adds is everything that happens *before* there is a file: may we hold it, what does holding it cost, for what purpose, and what happens when the source goes away.

It also matches what this bean asked for in the first place. Both crosswalks are `status: #draft`, `experimental: true`, and `CDHIv1toCDHIv2.fsh` is incomplete against its own stated scope. **Modelling their state is the point; treating them as settled by copying the rows in would assert a stability the publisher does not claim.**

So a v1 code does not yet resolve to v2 mechanically from inside this repository. What exists now is the precondition: every crosswalk is a known node with a resolvable location and a recorded state, which is what `materialize-remote.bpmn` needs as input.

## Done when
- [x] the crosswalks are known to the graph, by reference, with their state
- [x] the owner has said whether to run `materialize-remote.bpmn` over them, and for what purpose
- [x] the upstream findings are either reported or deliberately not

## Still open, and not ours to fix

`CDHIv1toCDHIv2.fsh` stops mid-group-4 and never emits the unmatched rows for the v2-only codes its own description promises. That is a finding about someone else's repository. Reporting it upstream is a decision, not a task.

The nine categories of health system challenge remain in the publication (`library/9789240081949-eng/sections/page-010.md`) and **not** in smart-base, where the only resource titled for them wraps the 25-code A–Y system-categories ValueSet. Worth a note to whoever owns the FSH.

_2026-10-03T14:13:37Z_ — Claimed by claude/fgkb-cpmo-qou-uploads — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Owner ruling 2026-10-03

Dispatched from https://claude.ai/code/session_015Q15h1fg2Hh9MJXfAqr4h7. Held by https://claude.ai/code/session_013Pdniq3SSCRvxhsN4E5aFi.

Selected option, verbatim: **"Keep by reference, report upstream"**. The four crosswalks are NOT materialized: `materialize-remote.bpmn` is not run, and they stay `referenced` in `smart-base/fhir-artifact-index/`.

Upstream draft: `smart-base/fhir-artifact-index/upstream-report-CDHIv1toCDHIv2.md`, pinned to WorldHealthOrganization/smart-base@5891a220e8ebbbd2d107282876a085641c5c767f. **Saved for the owner to file. Not posted upstream.** Findings, measured from the FSH (119 v1 codes, 138 v2 codes, 120 rows): (1) the map stops after 4.4, with no row for v2 4.3.5 or 4.5–4.5.4; (2) zero `unmatched` entries, and 22 v2 codes are the target of no row; (3) v1 3.5.3 has no row, and the description's "shifted by one" contradicts the identity rows 3.5.4–3.5.6. The draft also notes that R4 cannot put v2-only codes in a v1→v2 map, so keeping that promise needs a reverse map or a reworded description.

The nine-health-system-challenges note stays unfiled, as the 2026-09-22 text says. The ruling covered the ConceptMap finding only.

Done-when 2 is answered (do not materialize). Done-when 3 is answered (report it, as a draft for the owner). Close when this draft is merged.

## Summary of Changes

Closed 2026-10-03 by https://claude.ai/code/session_013Pdniq3SSCRvxhsN4E5aFi. Evidence: #2005 merged to main (PR head `68e18e0` is an ancestor of main `f10ad6d`). It carries `smart-base/fhir-artifact-index/upstream-report-CDHIv1toCDHIv2.md`, the upstream issue draft for WorldHealthOrganization/smart-base, pinned to `5891a22`.

- Ruling "Keep by reference, report upstream" applied: the four crosswalks stay `referenced`, and `materialize-remote.bpmn` was not run.
- The upstream report is a **draft for the owner to file**. It was not posted. Filing it is the owner's step, and the file says how.
