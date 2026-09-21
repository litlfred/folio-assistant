---
# folio-assistant-qsf5
title: 'FHIR IG ARTEFACT INDEX: a reusable index schema type, an ingest pipeline over published IG output, and smart-trust as the first subject'
status: completed
type: epic
priority: high
created_at: 2026-09-21T10:42:25Z
updated_at: 2026-09-21T12:39:12Z
---

Ingest the artefact index of a published FHIR IG that exposes a DAK API, and represent it as a KG using the IG's own JSON / JSON-LD / JSON Schema surface.

Generalisable across many IGs — smart-trust is the first subject, not the deliverable.

Evidence gathered 2026-09-21 from WorldHealthOrganization/smart-trust gh-pages (342,656 files, IG v1.8.0, FHIR 5.0.0):

- THERE IS NO PUBLISHED INDEX *INSTANCE*. `ValueSets.schema.json` and `LogicalModels.schema.json` sit at the gh-pages ROOT (not in `schemas/`) and are SCHEMAS describing an enumeration endpoint response, each carrying an `example` that holds the real list. No `ValueSets.json` is published. The index must therefore be RECONSTRUCTED from metadata, which is what the request says.
- DAK API layer: 14 ValueSet + 5 LogicalModel schemas, each with four sidecars — `.schema.json`, `.displays.json`, `.openapi.json` (in `schemas/`) and `.jsonld` (at root). Plus `tng-context/{v1,v1-DEV,v1-UAT}.jsonld` contexts.
- IG-publisher standard layer, present in EVERY IG: `package.tgz` -> `package/.index.json` (index-version 2; 674 files; filename/resourceType/id), `canonicals.json` (id/type/url/version/name), `artifacts.html` (7 categories), `package.manifest.json`, `qa.json`.
- TRAP: `openapi/openapi.json` is the DDCC Gateway API (a domain API), NOT the DAK API. An ingest that globs openapi will mis-file it.
- WART: `.index.json` Organization entries carry a truncated `"type": "["`. The publisher's index is lossy; `canonicals.json` is richer for canonical resources.

Graph kind settled from `content-context-and-state-graphs`: an ingested index is produced FROM A SOURCE and would be REGENERATED rather than re-authored -> `holds: "derived"`. Precedent for catalogue-by-reference is `who-iris/` (1,057,223 known, three materialized).

## Done when
- [x] a reusable artefact-index schema type exists, not smart-trust-specific
- [x] an ingest pipeline points at an IG and reconstructs its index from published output
- [x] a skill governs the pipeline (which IGs qualify, what to read, what to refuse)
- [x] smart-trust/ exists as the first ingested subject and validates the schema
- [x] gates green

## Summary of Changes

Merged to `main` as `7e791f1c` via PR #690, issue #689, with the owner's
explicit "merge". All 9 CI checks green; `bun run gates` 86/86.

**What shipped**

| piece | path |
|---|---|
| schema type | `folio-assistant-core/schemas/fhir-artifact-index.ts` |
| graph kind | `fhir-artifact-index`, registered beside `catalogue` |
| ingest pipeline | `cat-harness/scripts/ingest-ig-artifacts.ts` (`bun run ingest:ig`) |
| skill | `ig-artifact-ingestion` (authoring-who-smart-guidelines) |
| CI gate | `check:artifact-index`, wired into `code-quality-gates.yml` |
| first subject | `smart-trust/` — 674 artefacts, 655 referenced, 19 materialized |

**The finding that shaped it.** No FHIR IG publishes an artefact-index
INSTANCE. `ValueSets.schema.json` at the published root is a *schema*
describing an enumeration response, carrying an `example` that happens to hold
the list — and `dak-api.html` links it to a `schemas/` directory it is not in.
So the index is RECONSTRUCTED from four partial views, and `provenance` records
which published file each field came from. Coverage measured on smart-trust
v1.8.0: `canonicals.json` 70 entries, `package.tgz!.index.json` 674,
`artifacts.html` 676 links (the only source of a category),
`package.manifest.json` 1. None is sufficient alone.

**Two design calls worth keeping.** The kind is a SIBLING of `catalogue`, not a
flavour of it — a catalogue node is a container or an item, a FHIR artefact is
a `resourceType` at a canonical URL in a versioned package against a FHIR
version — but it SHARES `MaterializationSchema` rather than restating it. And
it is `holds: "content"`, not `derived`: `library` is derived because ingestion
produces bytes HERE, while this models a corpus that stays where it is.

**One correction made mid-flight.** This bean and issue #689 both recorded the
kind as `derived`. Reading the registry showed that was wrong before it reached
code; `catalogue`'s own comment covers the mixed case (who-iris: 1,057,223
known, three materialized) and settles it as `content`.

**#695 was adopted mid-flight.** `main` excised `harness.json` for
`<name>.config.json` while the PR was open. `smart-trust/harness.json` became
`smart-trust/smart-trust.config.json`, `check-artifact-index.ts` moved to
`declarationPathIn()`, and the skill's "Adding another IG" step was corrected —
following the old text would have produced an instance nothing discovers, which
no gate would have caught, because gates check what exists rather than what an
instruction tells someone to create.

**Deferred, not done.** The four-file merge is verified against exactly ONE
publisher output. "Generalisable across many IGs" stays a design claim until a
second DAK-API IG goes through the pipeline; the skill's "Adding another IG"
section is written but untested. Follow-up bean offered to the owner rather
than created unasked.
