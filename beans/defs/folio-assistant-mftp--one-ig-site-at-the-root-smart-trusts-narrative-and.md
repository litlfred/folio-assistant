---
# folio-assistant-mftp
title: 'ONE IG SITE AT THE ROOT: smart-trust''s narrative and artefact pages build as one just-the-docs site at /smart-trust/, in production too'
status: in-progress
type: task
priority: high
created_at: 2026-10-05T14:34:28Z
updated_at: 2026-10-05T14:34:48Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-05, looking at https://litlfred.github.io/folio-assistant/smart-trust/ with WHO's v1.7.3 TOC beside it: *"smart-trust is missing lots of pages"*. Offered (1) publish /ig/ in production, (2) +profile tabs, (3) merge the two sites; chose 3: *"1 but clean break on old beahviour, no redirect needed."* Follows `jut3` (P0) and `bamf`.

## Measured 2026-10-05
- Production /smart-trust/ is the COMPOSED artefact-index docs graph: index + 5 menu sections + 1 category in its nav. The 42 narrative pages (`bamf`) are built only by `feature-staging.yml` (`stage-ig-sites.ts`), at /<instance>/ig/; `docs-site.yml` never builds them. That is the whole gap the owner saw.
- smart-base has the same shape (menu.json with a sushi-config source) but /smart-base/ is a harness landing page (`n3ni`), so this is OPT-IN per instance, never inferred from menu.json.

## Design
- `igSite: true` on an instance's docs directory: built INTO the IG's own Jekyll site served at /<instance>/, never composed into the main site.
- `gen-ig-pages`: for such an instance, site-absolute links are relative to the IG site root, and the retired index/menu/category pages are not written.
- `stage-ig-sites`: such an instance builds at /<instance>/ with its artefact pages and assets copied into the IG site; the `artifacts` page links `artifact/`.
- `docs-site.yml` builds the IG sites too.

## Done when
- [x] `igSite` declared in the schema, set on smart-trust/docs
- [x] generator + stager honour it; smart-base unchanged
- [x] local build: every page in WHO's TOC present or accounted for; toc + artifacts links resolve
- [x] docs-site.yml builds IG sites
- [ ] gates green

## 2026-10-05: implemented (issue #2193)

Local build of the merged site (fork `litlfred/smart-trust` @ `25771f6`, jekyll 4.4.1):
- **All 37 TOC pages present** (toc, index, the 31 narrative pages, indices, artifacts, references, maps, license, dak-api), plus 678 artefact pages under `artifact/`.
- Sidebar: **35 entries**, WHO's own menu (it was 7).
- `toc.html` 74 links and `artifacts.html` 716 links: **0 broken**.
- Flat artefact links in WHO's prose (`ValueSet-Domains.html`): 20 rewritten to `artifact/` on smart-trust, 196 on smart-base (which keeps `/ig/`).
- Still broken on the root pages: Publisher-generated downloads (`*.zip`, `qa.html`, `video_tutorial.html`), an upstream case defect (`StructureDefinition-hcert.html`), and `openapi/` + `fhir-artifact-index/` — those two are served mounts that exist in production and that the old `/ig/` location could never reach.
- Build time ~29 s.

Theme: smart-trust's IG site had no webpage theme (`no-themes-directory`: the theme moved to smart-base in `kg83`). Owner, 2026-10-05: *"fix upstream smart-base issues as needed"* -- `webpagePalette` now inherits the nearest webpage theme along `needs` (smart-trust -> smart-ig -> smart-base: `who-smart-ig`), and the site renders WHO blue.

Viewer: the retired index carried the `fhir-artifact-index` viewer declaration. It now lives on a front-matter-only `docs/artifacts.md` that `copyDocsInto` lays onto the IG site's generated `artifacts` page; the navbar tile links `/smart-trust/artifacts.html`.

## 2026-10-05, later: owner feedback on the merged site

- *"use folio-assistnat LHS navbar, not custome one ... way too widf"* and *"the orignal topnvar bar should be preserved"*: every IG site now has a plain layout. It keeps WHO's top bar (the Publisher's menu as `<details>` dropdowns), declares the IG's TOC as the page's navbar section (`data-fa-visualiser-nav`), and has no sidebar. The post-build rail pass gives each page the shared navbar, railed as the owning instance's page (`igSiteOwner`). The section is named after the IG (owner chose "WHO SMART Trust") via `<meta name="fa-visualiser-label">`.
- *"make sure changes you do for smart-trust are reflected in smart-base and so smart-*"* and *"make sure no drift issues"*: smart-base declares `igSite` too, and the harness chrome is the ONLY IG-site layout (no per-site option). smart-immunizations holds no ingested menu, so it has no IG site yet and keeps its composed artefact pages.
- *"lost the links to edit the orignial source on github"*: each pagecontent page links `Edit this page on GitHub` at the IG's default branch, asked of the remote (`git ls-remote --symref`).
- *"feedback on (sub-*)sections should link to line numbers"* and *"add [shoutout] Feedback icon that opens a github issue ... preopopulted"*: each heading gets ✎ (its source line, `blob/<branch>/…#L<n>`) and 📣 (a new issue on the IG's repository, pre-filled with page, section and source line).

## 2026-10-05, later still: smart-immunizations, and Tools

- Owner: *"do https://github.com/litlfred/smart-immunizations"*. Its menu is ingested from the fork (`bd7fa72`, 5 groups, 27 items) and its docs declare `igSite`, so all three smart-* IGs are built the same way. Local build: 39 narrative pages + 748 artefact pages; `toc`, `artifacts`, `index` 0 broken links. No instance composes into the main site any more; compose-docs' real-tree tests now assert that state rather than a non-empty composition.
- Owner: *"make sure scripts you use go into Tools"*: `stage-ig-sites`, `ingest-ig-menu` (fhir-harness) and `rail-standalone-pages` (cat-harness) are now Tool nodes; `build-ig-site` and `ig-pages` were already, and their descriptions now say what they do here.
- Owner: *"build on the fork... instantiate smart-base there"*, *"see beans"*, *"...sibling work"*: follows `rbz3`'s `claude/seed-smart-base` on litlfred/smart-trust. The forks never run the Publisher's Actions (smart-immunizations has no runs and no gh-pages), so a fork's own workflow publishes its site at its gh-pages root.
- Owner: *"use https://github.com/litlfred/smart-trust as staging too. folio-assistant/smart-trust will just be a 'remote mounted' verison of (first) litlfred/smart-trust"* — recorded; not done here.

## 2026-10-05, evening: the IG pages are built INSIDE the main site

Owner: *"working except the chrome is not the standrad harness chrome. missing search bar/locale selctor"*, then chose *"Build in main site"* over copying the chrome per IG. This reverses `bamf`'s one-Jekyll-site-per-IG for the platform's own site:

- `composeIgSite` (fhir-harness `build-ig-site.ts`) moves a staged IG into the host's Jekyll source at `<instance>/`: includes → `_includes/ig/<instance>/` with `{% include %}` rewritten, data → `_data/ig/<instance>/` with `site.data.fhir` → `site.data.ig["<instance>"].fhir`, navigation nested under one entry (IG index = top level, group = child, item = grandchild via `grand_parent`), `layout: default` explicit, artefact pages `search_exclude`, and the IG's top bar + edit / source / feedback links as includes.
- `stage-ig-sites --compose-into ./_docs` runs before the main Jekyll build in `docs-site.yml` and `feature-staging.yml`; the separate per-IG Jekyll builds are gone; the duplicate-id pass runs per IG on `_site/<instance>/`.
- Artefact pages link their CSS relatively (`../assets/…`), right both in the host site and in a fork's standalone site.
- Local full build (jekyll 4.4.1 + just-the-docs 0.12.0): 4,352 pages, 74 s, no duplicate ids, no escaped markup; language selector, search, LHS navbar and the IG's TOC in the site nav verified in a browser.
- The standalone layout (`chrome: harness` path, rail-injected navbar) remains for an IG repository building its own site (litlfred/smart-immunizations' `folio-site.yml`).
