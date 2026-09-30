---
# folio-assistant-bamf
title: fhir-harness declares and populates FHIR IG Jekyll data (site.data.fhir.*) for the just-the-docs pipeline
status: todo
type: task
created_at: 2026-09-30T10:16:18Z
updated_at: 2026-09-30T10:16:18Z
parent: folio-assistant-zzmr
---

Owner 2026-09-30: IG pages use Liquid site.data.fhir.* (IG Publisher convention, e.g. {{site.data.fhir.ig.version}}). Those should be available in the just-the-docs pipeline, with fhir-harness RESPONSIBLE for declaring and populating the FHIR metadata Jekyll data.

## Measured 2026-09-30 (issue #1564 analysis)
- Nothing in folio-assistant resolves site.data.fhir.*: only the IG Publisher does. dak-pdf.ts renders pagecontent via remark-html, so {{site.data.fhir...}} comes out raw; pot-extract/po-inject only round-trip the tags.
- IG metadata already exists as data: fhir-artifact-index (packageId, version, fhirVersion, canonicalBase, builtAt, provenance) under smart-base/ and smart-immunizations/, chrome.json (id, canonical, version, status), sushi-config.yaml read by ingest-ig-menu.ts / ingest-ig-chrome.ts.
- The site already writes _data/ files (sync-docs-harness.ts -> harness.json) and hyphenated keys work (site.data.translation-qa.*).

## Done when
- [ ] fhir-harness declares a writer (a Tool, per 'tools declare what they write') that emits the IG Publisher-compatible site.data.fhir shape from sushi-config / fhir-artifact-index, for each IG instance
- [ ] the just-the-docs build runs it, so {{ site.data.fhir.ig.version }} etc. resolve on the site as they do in the IG Publisher
- [ ] fields with no source are reported as undetermined, never written as empty strings
- [ ] consistent with the harness-namespaced values bean (the same data under site.data.<harness>.*)
