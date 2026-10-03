---
# folio-assistant-izx8
title: 'FHIR IG API: rename the DAK-named IG API parts in fhir-harness (dak-views, dak-api hub, templates) once #1766 lands'
status: todo
type: task
priority: high
created_at: 2026-10-03T13:59:33Z
updated_at: 2026-10-03T13:59:33Z
parent: folio-assistant-wm63
---

Owner, 2026-10-03, on #1766: "2 but should be FHIR-IG-API, no DAK label/names". So #1766 merges first and its DAK-named hits in fhir-harness are baselined in check:fhir-harness-exclusions (an explicit owner exception to the never-widen rule). The API SURFACE (per-artefact .schema.json / .displays.json / .openapi.json and a hub) is the generic FHIR IG API and stays in fhir-harness. Only the DAK naming leaves: the WHO layer supplies the 'DAK API' label (the --sidecar-label pattern).

Measured on #1766's head, 2026-10-03, under the narrowed dak-naming rule: ~55 content hits plus DAK-named files — fhir-harness/scripts/dak-views.ts and its test, gen-ig-pages.ts (17), ingest-ig-artifacts.ts (7), stage-ig-sites.ts, and templates/ig-pages/dak-api.liquid, dak-openapi.js, dak-openapi.liquid, dak-view.liquid.

## Done when

- [ ] after #1766 merges: #1968's branch (or main) baselines its dak-naming hits with this bean as the reason
- [ ] files renamed to neutral names (e.g. ig-api-views.ts, templates/ig-pages/ig-api.liquid); identifiers and labels say IG API
- [ ] the 'DAK API' label is passed in from smart-base (package.json --sidecar-label), so WHO pages stay byte-identical
- [ ] the dak-naming baseline entries for these files are shrunk to zero
- [ ] gates green
