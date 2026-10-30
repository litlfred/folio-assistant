---
# folio-assistant-0om7
$schema: bean/1.0.0
title: 'IG previews publish outline.json and rendered-impact.json for the review page'
status: todo
type: feature
priority: low
created_at: 2026-10-24T13:20:00Z
updated_at: 2026-10-30T12:00:00Z
parent: folio-assistant-1xhc
---

Found walking #215 on smart-immunizations-uganda#12 (see lx2s). The IG route's review page says "No outline on this build: the folio's build did not publish outline.json" and "This build published no rendered-impact.json, so which rendered pages the change alters is not known". The folio route publishes both; the IG route (fhir-harness#158) does not yet.

## Done when
- [ ] an IG preview publishes `outline.json` over its narrative pages, and the review page shows the outline
- [ ] an IG preview publishes `rendered-impact.json`, and the review page lists the rendered pages each change alters

_2026-10-24T13:55Z_ — Claimed by https://claude.ai/code/session_01WJw1NBGSTLWvBnyQzJHXjx. Plan: fhir-harness `igChangeSet` also derives `outline.json` (the IG's pages, then its sources) and a `cone` `rendered-impact.json` (narrative pages with their anchors; other sources listed as undetermined, since the Publisher renders them).

_2026-10-24T13:53Z_ — fhir-harness#169 merged (341fbc7): IG previews write `outline.json` and `rendered-impact.json`. Its CI skipped the test shards, so the tests ran locally only (9 pass). Left open: the boxes need the next Uganda preview to confirm that the review page shows the outline and the page list. Issue fhir-harness#168.

_2026-10-30T12:00Z_ — Code merged: fhir-harness#169 (341fbc7, `scripts/ig-review-data.ts`), pinned in folio-assistant. The 10-24 claim is stale, so this goes back to todo until one Uganda IG preview built since then shows the outline and page list. Then close with fhir-harness#168. (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)
