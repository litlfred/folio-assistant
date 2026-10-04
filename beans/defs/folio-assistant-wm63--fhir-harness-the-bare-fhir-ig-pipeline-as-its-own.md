---
# folio-assistant-wm63
title: 'FHIR-HARNESS: the bare FHIR IG pipeline as its own harness layer, between core and smart-base'
status: in-progress
type: feature
priority: high
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-10-04T09:01:45Z
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
- [x] the two Library strippers are actually placed here, not just described
- [ ] the base is shown running for a non-WHO IG — `nsbb`'s open criterion
- [ ] gates green



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.

_2026-10-03T08:47:15Z_ — Claimed by claude/gifted-fermi-t8k217 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Exclusion list is a gate — 2026-10-03

Session https://claude.ai/code/session_015Q15h1fg2Hh9MJXfAqr4h7. `check:fhir-harness-exclusions` (smart-base/scripts/, because the list names WHO things and smart-base owns them) grades code, JSON values and BPMN, and counts prose mentions without grading them. The DAK step names are read from smart-base's own pre/post tables.

**The premise "the layer is clean today" was measured false:** 20 graded hits in 9 file×rule pairs, plus 65 prose mentions. Owner ruling: baseline the hits and ratchet now, and clear them in a second stream: bean `veiu`, session https://claude.ai/code/session_01PpaL9j6AhiTfvqnkF7BiaG.

The unexpected one: `fhir-harness/tools/index.ts` declares Tools for DAK post-processing steps 3-5, which smart-base's table assigns to the WHO layer. Owner ruled the same day: they STAY in fhir-harness (generic — they only transform existing metadata); recorded in the gate's MOVED_DOWN.

## Progress 2026-10-04 (wm63 session): the Library strippers are placed

- `fhir-harness/scripts/library-strip/` holds `strip_library_binaries.py` and `strip_library_content.py`, byte-identical to WorldHealthOrganization/smart-base `input/scripts/` at 5891a220 (CC-BY-3.0-IGO, attributed). The README records commit, licence and sha256.
- The Tools `strip-library-binaries` and `strip-library-content` now invoke the copies here instead of an IG repo's `input/scripts/`.
- `library-strip.test.ts` runs both on a non-WHO IG's output (an example.org Library carrying inline CQL and ELM) and checks the copies against the recorded hashes.
- Remaining: the non-WHO IG demo (blocked on network access to packages.fhir.org) and gates green.
