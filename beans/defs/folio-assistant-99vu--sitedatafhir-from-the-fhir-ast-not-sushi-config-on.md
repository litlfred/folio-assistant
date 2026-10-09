---
# folio-assistant-99vu
title: 'site.data.fhir from the FHIR AST, not sushi-config: one source for the site''s IG variables and its artefact pages'
status: scrapped
type: feature
priority: normal
created_at: 2026-10-09T15:38:22Z
updated_at: 2026-10-09T15:43:21Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-09: *"site.data.fhir should come fhir AST or so..."*.

## Today (measured 2026-10-09, litlfred/fhir-harness HEAD)

`fhir-harness/scripts/ig-site-data.ts` (bean `bamf`) fills `site.data.fhir` from
`sushi-config.yaml`, else `fhir-artifact-index/index.json`, and writes only
`ig.{id,url,name,title,version,status,publisher,fhirVersion}`, `packageId` and
`canonical`; everything else is listed `undetermined`. `ig-ast.ts` exists in
the same directory and is not a source. So two readings of the same IG — the
site's variables and the AST the artefact pages are built from — can disagree,
and the variables cover a small fraction of what the Publisher exposes.

## Plan

Make the FHIR AST the authority for `site.data.fhir` (and the Publisher's other
IG-derived data, e.g. `site.data.resources` / `site.data.pages`, which
smart-trust's `local-template/` layouts still read), with sushi-config only as
a fallback where no AST exists. Keep `bamf`'s rule: a field with no source is
`undetermined`, never `""`. Record provenance per field.

## Done when

- [ ] `ig-site-data.ts` (or its replacement) reads the FHIR AST first, with provenance naming it
- [ ] coverage of Publisher `site.data.fhir` fields measured before and after, the count stated with its source
- [ ] a disagreement between AST and sushi-config is reported, not resolved silently
- [ ] built and checked on smart-trust and smart-immunizations


## Scrapped 2026-10-09 — duplicate of `jut3`

Owner, 2026-10-09: *"do site.data.fhir from the FHIR AST. (that's not a bean already... please review fhir harness beans)"*. Review found it is: `jut3` (in-progress) carries the open item *"input/pages/ renders through just-the-docs with Publisher metadata populating the Jekyll variables"*, with the AST as the cache of the published IG. The work continues there; this bean's measurements were appended to `jut3`.
