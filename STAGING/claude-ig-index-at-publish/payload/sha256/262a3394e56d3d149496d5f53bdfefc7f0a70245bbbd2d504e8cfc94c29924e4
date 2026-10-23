---
# folio-assistant-4u5d
$schema: bean/1.0.0
title: 'IG artefact index built at publish by fhir-harness from the AST: no IG instance commits fhir-artifact-index/'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-23T14:30:00Z
updated_at: 2026-10-23T14:36:00Z
parent: folio-assistant-n3h9
---

## Parent

folio-assistant-n3h9

Related: folio-assistant-p7mb (build derived artefacts at publish).

Owner, 2026-10-23: "fhir-artifact-index/ → shouldn't that be a part of fhir-harness?" and "1 and implement" (plan, then implement). Plan: litlfred/fhir-harness#124. Thread "fhir-harness IG viewers".

## Why

smart-trust and smart-base commit `fhir-artifact-index/` (index, menu, releases; 1.3 to 1.5 MB each). These were ingested once from the published IG and now drift. smart-immunizations has never committed one, so it has no artefact index on the main site. The code is all in fhir-harness already; only the data sits in the instances. An IG repository declares nothing of fhir-harness's (fhir-harness AGENTS.md, skill ig-build-pipeline): it inherits through `needs`.

Measured on smart-trust's AST: 682 artefacts against 678 committed. 608 are identical, the AST has 4 newer ones and 458 more descriptions, and nothing exists only in the committed copy.

## Steps

- [x] fhir-harness#123: the ig-ast viewer lists IGs inherited through `needs` (`needing`, `lsRemote`, `AST_FAMILY_PREFIXES`)
- [x] fhir-harness#127: `ig-index:build` (`build-ig-indexes.ts`) writes index.json, menu.json and releases.json at publish for every IG instance. Real run: 3 of 3 built.
- [ ] folio-assistant: run `ig-index:build` before the IG page steps (docs-site.yml, feature-staging.yml, code-quality-gates.yml); retire `ingest:ig:check` and `ingest:ig-menu:check`
- [ ] smart-trust and smart-base: declare `fhir-artifact-index/` builtAtPublish (writer `ig-index:build`), delete the committed index/menu/releases/package.tgz, run SUSHI first
- [ ] DAK sidecars (`dak/`): move to smart-base's `ig-site:sidecars` step, never into fhir-harness
- [ ] Re-pin the index after each merge

## Open points

- Category grouping falls back to the Publisher default by resource type once no committed copy is left to keep it from.
- Published links need a published base, which fhir-harness must not guess.
