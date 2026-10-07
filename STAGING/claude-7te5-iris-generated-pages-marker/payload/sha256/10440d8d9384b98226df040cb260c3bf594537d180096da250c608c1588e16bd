---
# folio-assistant-d313
title: 'IG API: rename the DAK API surface in fhir-harness to a generic IG API'
status: completed
type: task
priority: high
created_at: 2026-10-03T09:23:38Z
updated_at: 2026-10-03T17:36:11Z
parent: folio-assistant-uhkv
---

Part of the layering in `nsbb` (bare FHIR IG pipeline is the base; DAK is an overlay).

Owner, 2026-10-03: "can we rename dakapi hub to someting more ig generic. split up/generifize code. relabel?" — and chose the name "IG API".

## What
fhir-harness's one rule is that it knows nothing of WHO, yet `dak-views.ts`, the `dak-*.liquid`/`.js` templates, the `dakApiHub` index field and ~30 sites in `gen-ig-pages.ts` carry DAK names. The surface itself is generic (per-artefact JSON Schema / displays / OpenAPI / JSON-LD sidecars plus a hub listing them); only three things are WHO's:
- the label "DAK API" (already `--sidecar-label`),
- the post-processing marker `<!-- DAK_API_CONTENT -->`,
- the hub's published file name `dak-api.html`.

## Plan
- [x] rename `dak-views.ts` -> `ig-api-views.ts` and every dak*/DAK_* identifier
- [x] rename templates `dak-*.liquid`/`.js` -> `ig-api-*`
- [x] schema: `dakApiHub` -> `igApiHub`; migrate the three committed indexes (key rename + recorded placeholder; regenerating needs the remote IG build)
- [x] WHO specifics become configuration supplied by smart-base (label, marker, hub file name); generic default label "IG API"
- [x] regenerate pages; tests; regen (gates run in CI on #1973)
- [x] PR #1973 stacked on #1970; #1816 notified (artifactPage overlap)

## Done when
No dak/DAK identifier or file name remains in fhir-harness/ outside configuration supplied by smart-base, the WHO sites render the same apart from renamed asset paths, and gates are green.

## Summary of Changes

Landed on main 2026-10-03 in #1766 (merge `f3b6168`), which carried #1970, #1973 and #1976. Follow-up regen of the four drifted generated files in the PR that closes this bean.
