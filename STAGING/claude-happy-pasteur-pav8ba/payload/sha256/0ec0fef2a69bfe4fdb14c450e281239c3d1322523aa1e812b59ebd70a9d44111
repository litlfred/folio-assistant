---
# folio-assistant-g4oc
title: 'Upstream DAK post-processing defects: view-page tabs, stale schemas/ copies, dead hub links'
status: todo
type: bug
created_at: 2026-10-01T17:05:28Z
updated_at: 2026-10-01T17:05:28Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-01: keep folio-assistant's consistent tab bar on the DAK view pages and record the Publisher-side defects as upstream issues. **Issues are disabled on both `litlfred/smart-base` and `litlfred/smart-trust`** (the API answers 410), so they are recorded here until the owner says where they go.

Measured on `litlfred/smart-trust` `gh-pages` at `9bd9643`, a build of `main` at `25771f6`. The cause is smart-base's `input/scripts/generate_dak_api_hub.py` at `e151a4d`.

## 1. Tab bars on the 33 DAK view pages
- **Tabs listed twice (12 pages).** The view pages are built from `html_content` after tabs are added, and the `page_filename in html_content` guard runs per page.
- **No JSON-LD tab on schema view pages (8).** Each is built before the JSON-LD tab is added to the main page.
- **Two active tabs on ValueSet view pages.** The transform deactivates only a tab labelled exactly `Content`; ValueSet pages say `Narrative Content`.
- **SD tab set on StructureDefinition view pages (5).** Probably intended; noted so the expected bar is stated.

## 2. Every schema / displays / OpenAPI sidecar published twice
All 52 pairs differ. The root copy is the current generator's output (Coding objects) and is what every page links. The `schemas/` copy is an older IRI-enum format under the same `$id`.

## 3. Dead links in `dak-api.html`
`ValueSets-enumeration.html`, `LogicalModels-enumeration.html` and `LogicalModels.html` do not exist on `gh-pages`.

## Done when
- [ ] the owner says where these are filed (enable issues on a fork, or the WHO repository)
- [ ] filed there, with this bean linking the issue

## 4. The JSON view heading's empty type label (IG Publisher template)
All 672 `<Name>.json.html` headings on smart-trust start with `": "` (for example `: Holder - JSON Representation`): the template's type label renders empty. This comes from the Publisher's own template, not from DAK post-processing. folio-assistant's JSON views drop it.
