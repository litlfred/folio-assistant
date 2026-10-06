---
# folio-assistant-ky3r
title: 'FOREIGN-SITE RAIL SCOPE (#2263): an IG repo''s site shows the platform''s tile counts, 404 tile links, and the pinned rail covers IG content'
status: in-progress
type: bug
priority: high
created_at: 2026-10-06T08:12:11Z
updated_at: 2026-10-06T08:12:26Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-06, verbatim (issue #2263): *"https://litlfred.github.io/smart-trust/ the beans and todos badges seems to be countts from folio-assistant and not litlfred/smart-trust as expected. links to beans and todos dont work. why not? fix process and skills."*

## Done when
- [ ] root cause named with file:line
- [ ] a foreign site's tiles, icon row and rail scope describe the FOLIO's instance; a state kind it does not declare shows no other instance's count or link
- [ ] no root-relative href in the scoped data reaches a foreign site: own paths resolve on the folio's baseurl, platform paths are absolute on DOCS_SITE_BASE and labelled
- [ ] the pinned-open rail reserves its width instead of covering IG content (Playwright before/after on smart-trust gh-pages 5b46623d)
- [ ] a test asserts (a) and (b) over a fixture shell; harness-tiles + the rail skill state the rule


## Collision review, 2026-10-06 (coordinate §"Starting new work"), before any edit
- **Open PRs (13), files intersected** with compose-docs.ts, head_custom.html, docs-ui.css/js, mount-instance-docs.ts, rail-standalone-pages.ts, harness-rail.ts, graph-tiles.ts, harness-tiles skill, fhir-harness/templates/ig-repo-site, folio-staging.yml, build-ig-site.ts, stage-ig-sites.ts, _data/harness.json, assets/{beans,todos,harness}:
  - #2264 (`claude/awesome-fermi-ua31th-ig-publisher`, #1901, IG page generator) changes build-ig-site.ts, build-ig-site.test.ts, stage-ig-sites.ts. **Not touched here**; the layout fix uses the rail's own CSS hook, not the generator's markup.
  - #2229, #2192, #2189 change `_data/harness.json` / `assets/beans/*` — GENERATED files, not a collision (this work does not edit them).
  - No other overlap.
- **In-progress beans** searched for rail, tile, foreign, folio-site, ig-repo-site, shell, 48a6, mftp: neighbours `mftp` (one IG site at the root) and `48a6` (fork sites drift, status todo) — subject-adjacent, no file overlap with the plan below.
- **Plan's files**: compose-docs.ts (shell scoping), a new lib module + test, rail-standalone-pages/mount-instance-docs (foreign tiles), docs-ui.css (pinned rail reserves width), the ig-repo-site template, harness-tiles skill + the rail skill. NOT gen-ig-pages/build-ig-site/stage-ig-sites, NOT mountSidebarRail.
