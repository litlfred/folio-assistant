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
