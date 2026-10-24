---
# folio-assistant-0om7
$schema: bean/1.0.0
title: 'IG previews publish outline.json and rendered-impact.json for the review page'
status: in-progress
type: feature
priority: low
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-24T13:55:00Z
parent: folio-assistant-1xhc
---

Found walking #215 on smart-immunizations-uganda#12 (see lx2s). The IG route's review page says "No outline on this build: the folio's build did not publish outline.json" and "This build published no rendered-impact.json, so which rendered pages the change alters is not known". The folio route publishes both; the IG route (fhir-harness#158) does not yet.

## Done when
- [ ] an IG preview publishes `outline.json` over its narrative pages, and the review page shows the outline
- [ ] an IG preview publishes `rendered-impact.json`, and the review page lists the rendered pages each change alters

_2026-10-24T13:55Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx. Plan: fhir-harness `igChangeSet` also derives `outline.json` (the IG's pages, then its sources) and a `cone` `rendered-impact.json` (narrative pages with their anchors; other sources listed as undetermined, since the Publisher renders them).
