---
# folio-assistant-qrnz
title: 'SECOND IG: ingest smart-immunizations, and find out whether the artefact-index pipeline actually generalises'
status: in-progress
type: feature
priority: high
created_at: 2026-09-21T14:13:32Z
updated_at: 2026-09-21T14:13:32Z
parent: folio-assistant-yj32
---

The generalisation test qsf5 deferred. Until a second DAK-API IG goes through, "generalisable across many IGs" is a design claim.

Subject: `smart.who.int.immunizations` v0.2.0, FHIR **4.0.1** (smart-trust is 5.0.0), gh-pages, 232,040 published files.

Measured 2026-09-21 before writing any code:

| | smart-trust | smart-immunizations |
|---|---|---|
| artefacts (.index.json) | 674 | 712 |
| canonicals.json | 70 (10%) | 712 (100%) |
| artifacts.html categories | 8, incl. "Other" | 13, no "Other" |
| DAK schema/openapi/displays | 19/19/14 | 198/198/188 |
| root *.jsonld | 16 | 190 |
| JSON-LD contexts | 3 | none |

## What this IG breaks, found by reading it rather than by running the pipeline

**1. The link-out copy added in #717 is WRONG here.** It tells the reader that DAK-carrying artefacts "appear under their own categories above" — true when the oversized category was 604 Endpoints with zero sidecars. Here Libraries (279), ValueSets (192) and PlanDefinitions (138) all exceed `INLINE_LIMIT = 100`, and ValueSets DO carry sidecars. Linking those out would hide 192 artefacts that have real per-artefact pages AND assert something false. The threshold must consider whether a category's artefacts have pages, not just how many there are.

**2. The page generator is smart-trust-specific.** `smart-trust/scripts/gen-smart-trust-pages.ts` hardcodes its instance. A second IG forces copy-or-lift; lifting is right, because an unavoidable duplicate is fine while an avoidable one is not.

## What this IG does NOT break, checked rather than assumed

The enumeration detector `/^[A-Za-z]+\.schema\.json$/` does not misfire on the 200 DUPLICATE per-artefact `<stem>.schema.json` this IG publishes at its root: every stem is `<ResourceType>-<id>` and contains a hyphen, so only `ValueSets.schema.json` and `LogicalModels.schema.json` match.

Sidecars are still under `schemas/<stem>.*`, so the overlay resolution should hold. The root duplicates are a second copy at a second URL and are deliberately NOT indexed as a separate representation unless a reason appears.

**`canonicals.json` covering 100% rather than 10% is the coverage finding.** smart-trust's "canonicals misses 604 of 674" does not generalise — the four-view merge still works, but which view carries the weight differs per IG, which is why provenance records all of them rather than naming a winner.

## Done when
- [ ] link-out accounts for whether a category's artefacts have their own pages
- [ ] the page generator is shared and instance-parameterised, not copied
- [ ] smart-immunizations ingested, index validates, counts recorded
- [ ] smart-immunizations/ declared with a docs graph, mounting at /smart-immunizations/
- [ ] smart-trust re-verified unchanged by the generalisation
- [ ] gates green

## Not verifiable here
litlfred.github.io is 403 policy-denied by this environment's egress proxy. The mount step's output and the gates are the evidence.
