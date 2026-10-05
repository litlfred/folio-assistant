---
# folio-assistant-izx8
title: 'FHIR IG API: rename the DAK-named IG API parts in fhir-harness (dak-views, dak-api hub, templates) once #1766 lands'
status: in-progress
type: task
priority: high
created_at: 2026-10-03T13:59:33Z
updated_at: 2026-10-04T07:09:29Z
parent: folio-assistant-wm63
---

Owner, 2026-10-03, on #1766: "2 but should be FHIR-IG-API, no DAK label/names". So #1766 merges first and its DAK-named hits in fhir-harness are baselined in check:fhir-harness-exclusions (an explicit owner exception to the never-widen rule). The API SURFACE (per-artefact .schema.json / .displays.json / .openapi.json and a hub) is the generic FHIR IG API and stays in fhir-harness. Only the DAK naming leaves: the WHO layer supplies the 'DAK API' label (the --sidecar-label pattern).

Measured on #1766's head, 2026-10-03, under the narrowed dak-naming rule: ~55 content hits plus DAK-named files — fhir-harness/scripts/dak-views.ts and its test, gen-ig-pages.ts (17), ingest-ig-artifacts.ts (7), stage-ig-sites.ts, and templates/ig-pages/dak-api.liquid, dak-openapi.js, dak-openapi.liquid, dak-view.liquid.

## Done when

- [x] after #1766 merges: #1968's branch (or main) baselines its dak-naming hits with this bean as the reason
- [x] files renamed to neutral names (e.g. ig-api-views.ts, templates/ig-pages/ig-api.liquid); identifiers and labels say IG API
- [x] the 'DAK API' label is passed in from smart-base (package.json --sidecar-label), so WHO pages stay byte-identical
- [x] the dak-naming baseline entries for these files are shrunk to zero
- [ ] gates green

## 2026-10-03, after #1766 merged — most of this was done by #1766 itself

#1766 renamed its own DAK-named parts before merging (bean d313): dak-views.ts became ig-api-views.ts, the DAK-named templates are gone, and the WHO names are passed in as configuration (--sidecar-label, --api-hub-page, --api-hub-markers, --api-placeholder). About 55 hits became **6 hits in 3 files**, baselined in #1968 against this bean under the owner's merge-first exception:

- ig-api-views.ts: a string naming the `smart-base/` layout, and one citing `generate_dak_api_hub.py`
- ig-api-views.test.ts: a test title saying "DAK views", and two `smart-base/` example paths
- ig-binary-audit.test.ts: a fixture blob name with `smart.who.int.base`

What remains is these six small rewordings, then `--shrink`.

## Progress 2026-10-04 (wm63 session)

- #1766 / d313 already did the renames: `ig-api-views.ts`, IG API labels, and `--sidecar-label "DAK API"` passed in from package.json.
- The six leftover hits were test titles and sample data. They now read: "the IG API views"; an `ig-data/` temp dir in place of `smart-base/`; and `validator-hl7.fhir.uv.example.pack`.
- Two hits in `ig-api-views.ts` were false positives from the gate itself: a regex literal with three quotes flipped `codeOf`'s string state. The lexer is fixed and covered by a test.
- All five izx8 baseline entries are shrunk to zero (baseline 12 → 7, all veiu's). Remaining item: gates green on the PR.
