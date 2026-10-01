---
# folio-assistant-680p
title: 'IG render: load from the KG client-side to cut .html bloat'
status: in-progress
type: task
created_at: 2026-10-01T16:11:22Z
updated_at: 2026-10-01T16:11:22Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01, verbatim: "note, other goals of jsutthedoc rendering is to reduce the .html bloat.... lots of it can be loaded client side from the KG".

The Publisher writes every view as a full static HTML page, though its own DAK view pages already fetch their file in the browser. A just-the-docs page should carry identity and layout, and fetch repeated or bulky content at view time from the committed KG graph (`fhir-artifact-index/`, `dak/`): sidecar files, artefact metadata, DAK API endpoints.

## Done when
- [x] the DAK view pages fetch their file client-side; no file text is baked into a page
- [ ] the artefact pages' DAK API sections and the dak-api replica read their data from the KG client-side
- [ ] a measured before/after of the smart-trust site's built HTML bytes, recorded here
- [ ] the trade-off stated: what a no-JS reader or a search index loses, and what still renders without JS

## 2026-10-01: DAK view pages fetch their file

The 33 view pages carry the tab bar, the heading and the links. Their file is
fetched by one shared loader, `smart-trust/scripts/templates/dak-view.js`,
published as `smart-trust/docs/assets/dak-view.js`, exactly as the
Publisher's page does: fetch, then `JSON.stringify(parsed, null, 2)`.

- **Verified in Chromium** (Playwright against a local Jekyll build): all 33
  show text identical to what the Publisher's page shows for the fork's
  `gh-pages` at `9bd9643`.
- **Bytes:** the page source fell from 6,845 to 5,675 bytes
  (`ValueSet-Actors.schema.json.md`). Built HTML is 385 KB for the 33 pages
  against the Publisher's 475 KB; most of ours is the shared just-the-docs
  chrome, not content.
- **No JS:** a `<noscript>` line points to the raw file, which renders without
  JavaScript.
