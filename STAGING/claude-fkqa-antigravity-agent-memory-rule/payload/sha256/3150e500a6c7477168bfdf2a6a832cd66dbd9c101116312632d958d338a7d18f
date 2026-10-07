---
# folio-assistant-bamf
title: fhir-harness declares and populates FHIR IG Jekyll data (site.data.fhir.*) for the just-the-docs pipeline
status: completed
type: task
priority: normal
created_at: 2026-09-30T10:16:18Z
updated_at: 2026-09-30T20:09:40Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: IG pages use Liquid site.data.fhir.* (IG Publisher convention, e.g. {{site.data.fhir.ig.version}}). Those should be available in the just-the-docs pipeline, with fhir-harness RESPONSIBLE for declaring and populating the FHIR metadata Jekyll data.

## Measured 2026-09-30 (issue #1564 analysis)
- Nothing in folio-assistant resolves site.data.fhir.*: only the IG Publisher does. dak-pdf.ts renders pagecontent via remark-html, so {{site.data.fhir...}} comes out raw; pot-extract/po-inject only round-trip the tags.
- IG metadata already exists as data: fhir-artifact-index (packageId, version, fhirVersion, canonicalBase, builtAt, provenance) under smart-base/ and smart-immunizations/, chrome.json (id, canonical, version, status), sushi-config.yaml read by ingest-ig-menu.ts / ingest-ig-chrome.ts.
- The site already writes _data/ files (sync-docs-harness.ts -> harness.json) and hyphenated keys work (site.data.translation-qa.*).

## Done when
- [x] fhir-harness declares a writer (a Tool, per 'tools declare what they write') that emits the IG Publisher-compatible site.data.fhir shape from sushi-config / fhir-artifact-index, for each IG instance
- [x] the just-the-docs build runs it, so {{ site.data.fhir.ig.version }} etc. resolve on the site as they do in the IG Publisher — REWORDED by the owner 2026-09-30: one Jekyll site per IG, built by the IG's OWN repository (build-ig-site, #1670), not by this one. Verified locally on smart-trust's real source; running it in an IG repo waits on the split (bean filed)
- [x] fields with no source are reported as undetermined, never written as empty strings
- [x] consistent with the harness-namespaced values bean (the same data under site.data.<harness>.*)

## Round 1, 2026-09-30
- `fhir-harness/scripts/ig-site-data.ts` + Tool node `ig-site-data`: `site.data.fhir` for ONE IG (Jekyll has one `_data/`, as the Publisher builds one IG). Sources: `sushi-config.yaml`, else `fhir-artifact-index`. Writes `ig.*` (ImplementationGuide resource fields), `packageId`, `canonical` — only what it can source; lists the rest as undetermined.
- fhir-harness declares `liquid: { prefix: "site.data", passThrough: true }` (bean kott), so the platform resolver leaves these for Jekyll / the Publisher.
- **Finding:** `smart-base/fhir-artifact-index/chrome.json` describes `smart.who.int.trust` 1.8.0 while `index.json` is `smart.who.int.base` 0.3.0 — a mis-filed chrome. The tool refuses it rather than publishing another IG's status; the file itself is not changed here.
- Tests 5, calibrated (bypassing the package check fails the refusal test). Uses the REAL smart-base index, so it is not vacuous.
- **Open:** no IG render in this checkout calls it yet — there is no `input/pages/` IG here (P0's page half), so the "just-the-docs build runs it" box stays open.


## Round 2, 2026-09-30: one Jekyll site per IG (owner's choice)
- The owner chose one site per IG over per-page resolution and over namespacing: pages keep `{{ site.data.fhir.* }}` unchanged, as under the Publisher.
- `fhir-harness/scripts/build-ig-site.ts` and Tool `build-ig-site` stage an IG source repository as ONE just-the-docs Jekyll source. It carries pagecontent with title, parent and order from sushi-config `pages:`; the includes the Publisher resolves; images; `_data/fhir.json` via ig-site-data; and `_config.yml`. PlantUML sources are rendered with `--plantuml-jar`, otherwise a VISIBLE marker stands in and is reported.
- Measured on smart-trust's real source (WorldHealthOrganization/smart-trust@30d55b3), built with Jekyll 4.4.1 and just-the-docs 0.12:
  - all 42 pages render;
  - feedback.html resolves `{{ site.data.fhir.packageId | split: '.' | last }}` to the trust repository link;
  - 2 diagrams are rendered;
  - 3 Publisher-generated fragments are markers (dependency-table.xhtml, list-structuremaps.xhtml, actordefinition-short-summary.liquid);
  - 7 pages are absent from sushi-config pages.
- Screenshots were sent to the owner. Tests: 7, calibrated.
- **Still open:** CI does not run it yet. The IG SOURCE is not in this repository, and where it comes from (a declared source in the instance, or a workflow clone) is the owner's call.


## Summary of Changes
- #1591: ig-site-data writes site.data.fhir from sushi-config or fhir-artifact-index; fhir-harness declares site.data as a pass-through prefix.
- #1670: build-ig-site stages one IG as one just-the-docs site (owner's choice).
- Running it inside an IG's own repository waits on the split (vke6), and is tracked in its own bean.


## 2026-09-30, later: a staging TEST of smart-trust's own site, on this repository
The owner asked to see smart-trust's landing page here, on staging, with its existing nav menu. stage-ig-sites.ts builds every IG whose menu.json records its source (of + ref) into /<instance>/ig/ on the feature-staging preview. The long-term home is still the IG's own repository (bean 4475).
