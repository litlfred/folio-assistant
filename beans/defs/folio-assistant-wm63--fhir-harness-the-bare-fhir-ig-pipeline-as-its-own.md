---
# folio-assistant-wm63
title: 'FHIR-HARNESS: the bare FHIR IG pipeline as its own harness layer, between core and smart-base'
status: in-progress
type: feature
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-10-03T08:47:15Z
parent: folio-assistant-uhkv
---

`fhir-harness` — the layer bean `nsbb` called "the bare FHIR IG pipeline", now
named by the owner's stack ruling of 2026-09-22.

## What it is

SUSHI → IG Publisher → Jekyll → a pages branch. **No pre-processing and no
post-processing.** This is how SMART Guidelines were built before the DAK
phases were added, so it is a shape that demonstrably worked rather than one
being invented.

## The definition that does the work is the EXCLUSION list

"Generic" is a claim; a list is checkable. The layer may contain no reference
to `dak.config.json`, the DAK logical model or any DAK component, any
`smart.who.int` canonical, the DAK API surface, the pre/post steps, or anything
in `authoring-who-smart-guidelines`.

**The import direction is the enforceable half**, and the failure mode is that
there is none: a WHO reference here fails no gate, stays green, and quietly
makes the layer unusable for the non-WHO IG it exists for.

## Two steps came DOWN into it

`strip_library_binaries.py` and `strip_library_content.py` arrive labelled
*"DAK Postprocessing"* and are not DAK-shaped — any IG depending on
`hl7.fhir.uv.cql` produces oversized `Library` resources.

That is the layering rule producing a result the steps' own names contradicted,
which is the only kind of evidence that a split is doing work.

## Done when
- [x] the instance exists, declaring only directories that exist (`dh4f`)
- [x] `ig-build-pipeline` states the run and the refusal list
- [x] `ig-render-jekyll` states the three render contracts
- [ ] the two Library strippers are actually placed here, not just described
- [ ] the base is shown running for a non-WHO IG — `nsbb`'s open criterion
- [ ] gates green



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.

_2026-10-03T08:47:15Z_ — Claimed by claude/gifted-fermi-t8k217 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
