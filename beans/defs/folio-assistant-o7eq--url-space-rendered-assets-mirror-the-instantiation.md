---
# folio-assistant-o7eq
title: 'URL SPACE: rendered assets mirror the instantiation structure — <baseurl>/ for the root, <baseurl>/<instance>/<path> for every enabled harness'
status: todo
type: feature
priority: normal
created_at: 2026-09-20T18:30:55Z
updated_at: 2026-09-20T18:30:55Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), verbatim:

> rendered assets should be available at toplevel like `<baseURL>/` for main
> just the docs pipeline, or `<baseurl>/<page>` where is registered rendered
> page from a harness that was instantiated and enabled (by default enabled)
> relative to their url, so `<baseurl>cat-harness/docs` or so...
> `<baseurl>/<instantiated harness>/<path_to_rendered_content>`, bootstrap
> jsonld/json is example

## The rule, as stated

**The published URL space mirrors the instantiation structure.**

| what | where it is served |
|---|---|
| the root instance's just-the-docs site | `<baseurl>/` |
| a registered rendered page of the root pipeline | `<baseurl>/<page>` |
| any other instantiated, enabled harness | `<baseurl>/<instance>/<path>` |
| worked example | the bootstrap graph's `.jsonld` / `.json` at its instance's own path |

Two properties to read off the wording and not lose:

- **Enabled is a state, and its default is enabled.** So an instance is
  published unless something says otherwise — which means "not rendered" has
  to be a *declaration*, not an absence, or the three-state rule is broken
  the usual way.
- **Relative to their url.** An instance's rendered content is addressed
  under the instance, so a path inside it is composed from the instance's own
  root rather than from the site root. That is the same
  compose-nothing-resolve-everything shape the rest of the graph already uses.

## Why this is not just a routing detail

It decides what `siteDir` / `siteDirFor` must return per instance, what the
LHS navbar links to (`603s` renders one themed section per instance — this
says what each section's href *is*), and what a staged preview mirrors under
`STAGING/<slug>/`. It is also the missing half of `hfkl`: that bean has the
owner's ruling that bootstrap gets no visualiser but *"its json/jsonld IS its
existence"* — this says where that artefact is served from.

## Open, and worth settling before building

- **Instance name or stub?** `cat-harness` declares `name: cat-harness` and
  `stub: folio-assistant`, and the owner's example writes `cat-harness/docs`
  — so the URL segment looks like the **name**, while the published artefact
  is currently named by the **stub**. #477 recorded that a declaration carries
  both on purpose. Which one is the URL segment?
- **Where does `enabled` live** — a field on the instance's declaration, or
  derived from whether it declares a renderable graph?
- **Does the root instance also get a segment**, so its content is reachable
  both at `<baseurl>/` and `<baseurl>/<root-instance>/`, or only at the root?

## Done when

- [ ] `enabled` is a declared field with a default of enabled, and a disabled
      instance is a declaration rather than an absence
- [ ] The three questions above are answered by the owner
- [ ] One resolver composes an instance's published URL, and every consumer
      goes through it — no site path composed by hand
- [ ] `docs-site.yml` and `feature-staging.yml` publish each enabled instance
      under its own segment, and a test asserts the layout for at least two
      instances
- [ ] The bootstrap `.jsonld` / `.json` resolves at its instance path, which
      is the example the owner named

Related: `yj32` (harness as interface), `hfkl` (bootstrap's json/jsonld is its
existence), `x4a6` (declare `docs/` as the renderable graph), `ohx6`
(cat-harness/folio's minimal rendering), `603s` and `nvbr` (the navbar
sections that link to these URLs), `gn4l` (generating a second instance's
graph), `6pfo` (staging previews as published metadata).
