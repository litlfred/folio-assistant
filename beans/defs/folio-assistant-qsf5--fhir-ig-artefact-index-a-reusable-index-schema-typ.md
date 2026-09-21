---
# folio-assistant-qsf5
title: 'FHIR IG ARTEFACT INDEX: a reusable index schema type, an ingest pipeline over published IG output, and smart-trust as the first subject'
status: in-progress
type: epic
priority: high
created_at: 2026-09-21T10:42:25Z
updated_at: 2026-09-21T10:42:25Z
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
