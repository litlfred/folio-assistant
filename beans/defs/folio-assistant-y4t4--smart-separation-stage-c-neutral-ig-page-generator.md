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
- [ ] C1 gen-ig-pages neutral: --publish-note and --sidecar-label flags (neutral defaults); smart-trust and smart-base pass WHO values and stay byte-identical
- [ ] C2 neutral sidecar overlay in fhir-artifact-index schema (dak -> sidecars), committed index.json migrated with no artefact data change, ingest + generator follow; DAK label supplied by smart-base
- [ ] C3 fhir-artifact-index kind viewer for every instance declaring one
- [ ] gates: no failure absent on main
