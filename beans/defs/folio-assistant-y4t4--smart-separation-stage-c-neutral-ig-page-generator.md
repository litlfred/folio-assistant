---
# folio-assistant-y4t4
title: 'SMART-* SEPARATION stage C: neutral IG page generator, neutral sidecar overlay, fhir-artifact-index viewer per instance'
status: in-progress
type: task
created_at: 2026-10-01T12:15:53Z
updated_at: 2026-10-01T12:15:53Z
parent: folio-assistant-n3ni
---

Stage C of cat-harness/docs/proposals/smart-separation-2026-10-01.md (#1767). Owner: go ahead with stage C (2026-10-01); Q3 decided: neutral sidecar overlay.

fhir-harness/AGENTS.md: nothing here may know about WHO. gen-ig-pages (stage A) writes a WHO publish note and DAK API sections; the artefact-index schema carries a WHO-named dak overlay.

## Done when
- [x] C1 gen-ig-pages neutral: --publish-note and --sidecar-label flags (neutral defaults); smart-trust and smart-base pass WHO values and stay byte-identical
- [x] C2 neutral sidecar overlay in fhir-artifact-index schema (dak -> sidecars), committed index.json migrated with no artefact data change, ingest + generator follow; DAK label supplied by smart-base
- [x] C3 fhir-artifact-index kind viewer for every instance declaring one: index pages carry renders front matter; harness-tiles routes composed-dir refs to /<instance>/; smart-immunizations gets docs (752 pages) + pages gate
- [x] gates: CI green on #1783 (c617cee1, then c05387e8 after A and B merged)

C2 as built: fhir-artifact-index schema, ingest-ig-artifacts, check-artifact-index (+ ingest invocation test) moved core -> fhir-harness. dak -> sidecars, dakApi -> sidecarApi, dakUnbound -> sidecarsUnbound, provenance.dakEnumerations -> sidecarEnumerations; tag folio-fhir-artifact-index/v1 -> v2 (renamed fields under the same tag would misdescribe the data). Committed index.json x3 migrated by key rename only, verified by reversing the rename and comparing to the original. The materialised sidecar DIRECTORY stays dak/ (981 files; the data leaves for the forks anyway): ingest takes --sidecar-dir (default sidecars), the WHO ingest scripts pass dak. tsconfig now covers fhir-harness/{schemas,scripts}: moving the schema out of core had silently dropped it from type-checking, which is how FhirArtifact["dak"] survived the rename; two older type errors in gen-ig-pages surfaced and are fixed.
