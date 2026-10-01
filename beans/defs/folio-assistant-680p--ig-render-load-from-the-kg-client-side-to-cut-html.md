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
- [x] a measured before/after of the smart-trust site's built HTML bytes, recorded here
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

## Owner ruling 2026-10-01: serve the graph, no copies

The owner chose option 1: publish the KG directory itself rather than copy its
files into `docs/`.

- **The `served` field.** A directory entry can now declare `served: true`
  (schema `cat-harness.ts`), and `mount-instance-docs.ts` publishes its bytes
  verbatim at `/<instance>/<path>` after Jekyll. The step is opt-in, honours
  `withheld.json`, and refuses to write over anything already published.
- **Declared on** smart-trust's and smart-base's `fhir-artifact-index/`.
- **The view pages** fetch `../fhir-artifact-index/dak/<file>`. The 19 copied
  schema files and the docs-kind exception they needed are gone.
- **Refusal.** `gen-ig-pages` writes no view page when the index directory is
  not served, and says so.
- **Verified in Chromium:** all 33 smart-trust view pages still display
  exactly what the Publisher's pages display.

## 2026-10-01: one stylesheet, not 2,153 inline copies; printing

**Measured first.** smart-trust's generated pages were 12.2 MB, and 6.7 MB of
that (55 %) was one 3.1 KB `<style>` block inlined into all 2,153 pages: the
shared rules plus the mirrored IG chrome. `gen-ig-pages` now writes them once,
as `assets/ig-pages.css` and `assets/ig-chrome.css`, and each page links them
through `relative_url`.
- **After:** smart-trust 12.2 MB → **5.9 MB (−52 %)**; smart-base 0.88 MB.
  The only inline style left is the hub's 278-byte `h4` rule.
- The page tests now read the stylesheet files, and check that every page
  links them and inlines none.

**Printing** (owner: *"what about printing a page with loaded content?"*). A
browser prints what has loaded.
- Chromium PDFs of a JSON view page: printed at `domcontentloaded`, it lacks
  the JSON; printed after `<html data-kg-loaded>`, it holds it.
- Every loader now counts itself in and out, and the last to finish sets that
  attribute. `visualizer-loading` §"Printing and PDFs" says a print or PDF step
  waits for it, never for a fixed delay.
