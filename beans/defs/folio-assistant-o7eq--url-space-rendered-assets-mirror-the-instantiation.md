---
# folio-assistant-o7eq
title: 'URL SPACE: rendered assets mirror the instantiation structure — <baseurl>/ for the root, <baseurl>/<instance>/<path> for every enabled harness'
status: todo
type: feature
priority: normal
created_at: 2026-09-20T18:30:55Z
updated_at: 2026-09-20T19:05:32Z
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


## OWNER, 2026-09-20 — the segment is the instance NAME, and the graph is in the path

> i gues s should be `<baseurl>/cat-harness/docs` , no? and
> `<baseurl>/cat-harness/docs/<path to subgraph/node on which docs/ can be
> rendered>`?

Yes. That settles two of the three open questions.

### 1. Name, not stub — settled

`cat-harness` is the instance's `name`; its `stub` is `folio-assistant`. The
owner's example writes `cat-harness/`, so the URL segment is the **name**.

**A consequence to reconcile, not a blocker.** `kg-export` publishes the graph
at `<base>/<stub>.jsonld`, and #477 recorded the split deliberately: *"the stub
names the published artefact, the name names the instance"*. Under this rule a
URL is composed from the name, so the two vocabularies now meet in the same
path space. Either the stub keeps naming exactly one artefact (the graph
document) while everything else is under the name, or the stub becomes
redundant. Worth deciding before more consumers compose paths.

### 2. The declared graph IS a segment — settled, and it has to be

`<baseurl>/<instance>/<declared graph>/<path>`. Not a flattening.

The reason is that an instance may declare more than one renderable graph:
`ohx6` wants `cat-harness/folio/` as a minimal rendering beside `docs/`, and
`x4a6` is about declaring `docs/` as the renderable graph in the first place.
Without the graph in the path, two renderable graphs in one instance collide
on the same URL. With it, adding a second is free.

### 3. Still open — does the ROOT instance also get a segment?

Today the root's just-the-docs site is at `<baseurl>/` and `docs/` does **not**
appear: `<baseurl>/guides/agent-onboarding.html`, not
`<baseurl>/docs/guides/...`. So the root is already an exception to the rule
above.

Two ways to hold that, and it is a small decision with a large blast radius on
links:

1. **The root elides both segments, as a stated exception** — the root IS the
   site. Same shape as `hfkl`'s "bootstrap is the exception": an exception that
   is declared rather than emergent. Nothing moves. **Recommended.**
2. **The root is also reachable at `<baseurl>/<root-name>/docs/...`**, with
   `<baseurl>/` an alias. More uniform, and it means every instance including
   the root is addressed the same way — at the cost of two URLs for every
   existing page.

## Done when

- [x] The URL segment is the instance's `name` — ruled
- [x] The declared graph is a path segment rather than elided — ruled
- [ ] The root instance's exception is chosen (1 or 2 above)
- [ ] `enabled` is a declared field defaulting to enabled, so "not rendered"
      is a declaration and not an absence
- [ ] One resolver composes an instance's published URL and every consumer
      goes through it
- [ ] `docs-site.yml` and `feature-staging.yml` publish each enabled instance
      under its own segment, with a test asserting the layout for at least two
- [ ] The bootstrap `.jsonld` / `.json` resolves at its instance path



---

## Its first two consumers exist — 2026-09-20, PR #583

`schemas/` and `library/` now publish under this rule. Both resolve the
rendered-content root through `siteDirFor` and take the published segment from
the **declared directory's own name**, so neither writes an instance name nor a
graph name down anywhere — `check:declared-paths` caught the first draft doing
exactly that and was right to.

Under the ruling recorded above they are **case 2**, a registered rendered page
of the root pipeline, at `<base>/schemas/` and `<base>/library/`. So they need
no change while the root instance elides its own name; if that changes, the
segment is composed in one place in each generator.

Bean `8325` was opened in a parallel session from the same owner statement and
is now **scrapped** as a duplicate of this one, carrying two measurements worth
keeping: `siteDir()` + `artefactStub()` are the two resolvers this rule needs
and both already exist, and `check:instance-render` is the conformance check it
wants — three states, 'undetermined is never a pass' — so extending that is more
likely right than writing a second.
