---
# folio-assistant-8325
title: 'RENDERED-ASSET URLs: every instance''s rendered content is addressed at <base>/<instance>/<path>, registered and enabled-by-default'
status: scrapped
type: task
priority: normal
created_at: 2026-09-20T18:29:51Z
updated_at: 2026-09-20T19:05:32Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20, verbatim — asked as the answer to a narrow question
(`schema/` or `schemas/` for one visualiser's URL) and answered as a general
rule, which is why it is beaned here rather than inside `xgd8`:

> rendered assets should be available at toplevel like `<baseULR>/` for main
> jsut the docs pipleline, or `<baseurl>/<page>` where is registered rendered
> page from a harness that was instantiated and enabled (by default enabled)
> realtivg to their url, so `<baseurl>cat-harness/docs` or so...
> `<baseurl>/<insantiated harness>/<path_to_rendered_conentent>`, bootstrap
> jsonld/json is example

## The rule, in the terms the repository already uses

Two addressing cases, and the second is the general one:

1. **`<baseURL>/`** — the main just-the-docs documentation pipeline. What a
   reader lands on.
2. **`<baseURL>/<instantiated harness>/<path to rendered content>`** — any
   rendered page REGISTERED by an instance that has been instantiated and
   **enabled** (enabled by default), addressed **relative to that instance's
   own URL**.

Three words in that are load-bearing and none of them exists as a declared
thing today:

- **registered** — an instance says which of its rendered pages are
  addressable. That is a declaration, and there is none.
- **instantiated** — the instance exists as an instance, not merely as a
  directory in a checkout.
- **enabled, by default enabled** — a rendered page can be turned OFF, and the
  absence of a setting means on. So this is a tri-state read (`enabled`,
  `disabled`, `not declared` → enabled) rather than a boolean.

## The worked example the owner named, and it already half-exists

**Bootstrap's `.jsonld`/`.json`.** `kg-export` writes `<stub>.jsonld` and the
deploy copies it to `<stub>.json` because Pages has no media type for
`.jsonld`; `kg-viewer` writes `<stub>/index.html` so that an extensionless
`<base>/<stub>` resolves. The comment in `docs-site.yml` states the principle
this bean generalises:

> the stub is what separates one instance's renderings from another's in a
> tree that overlays several

So the STUB is already the `<instantiated harness>` level, and two resolvers
for the two halves of `<instance>/<path>` already exist:
`artefactStub(decl)` names the instance, `siteDir(decl)` gives the
rendered-content root relative to the instance root. What does not exist is
the REGISTER, and the enabled flag.

Bean `hfkl` is the constraint on this from the other side: bootstrap is exempt
from having a visualiser, but its `.json`/`.jsonld` is **required — "that is
its existence"**. So bootstrap is precisely the instance where the register
must work while the visualiser is absent, which makes it the right first test
rather than an edge case to defer.

## Measured 2026-09-20, before claiming anything is missing

- `siteDir()` returns **`docs`**, relative to the instance root — it got
  SHORTER when `wggr` gave each instance its own directory, because the stub
  level stopped being something to compose.
- `cat-harness/docs/` is published at **`<base>/`** today
  (`docs-site.yml`: `source: ./cat-harness/docs`), i.e. case 1 above — so
  cat-harness is currently the instance whose rendered content is AT the base
  rather than under a segment. Whether that is the rule's case 1 or an
  exception to case 2 is the first thing to settle, and the owner's own
  example (`<baseurl>cat-harness/docs or so`) is written both ways in one
  sentence.
- `check:instance-render` exists and asks whether an instance can render its
  own JSON-LD and publishes only what it owns — three states, with
  "undetermined" never a pass. **That is the conformance check this rule needs,
  already built**, and extending it is more likely right than writing a second.
- **No declaration field anywhere carries "registered rendered page" or
  "enabled".** `grep` over `schemas/cat-harness.ts`: `renderable` is a property
  of a graph KIND, not of a page, and it answers "is this wired to the site
  build" rather than "is this addressable at a URL". They are different
  questions and conflating them would put a page-level switch on a kind shared
  by every instance.

## Why this is its own bean

`xgd8` needed one path and got a rule governing all of them. A rule about how
every instance addresses every rendered artefact does not belong in the bean of
the first artefact that needed it — the next four visualisers (`jbx2`, `v1hw`,
`km90`'s board, whatever `2krx` forces) each need the same answer, and if it
lives in `xgd8` they will each re-derive it. That is the `AGENTS.md` banner's
own argument applied to beans: a rule with no home is a rule free to drift.

## Open questions for the owner

1. **Is cat-harness's `docs/` at `<base>/` the rule's case 1, or an exception
   to case 2?** The example sentence reads both ways. If case 2 is uniform,
   cat-harness's docs move to `<base>/cat-harness/` and every existing link
   into the published site changes — which is a large, reversible-only-by-
   redirect decision and must not be taken quietly.
2. **Where is "registered" declared** — in `harness.json` beside
   `directories`, or in the rendered content's own front matter? The first
   makes the instance the authority; the second makes each page one.
3. **What does `enabled: false` DO** — not published at all, or published and
   unlinked? Those differ for anyone holding an old URL.

## Done when

- [ ] Registration and the enabled tri-state are declared in a schema, with
      absent meaning enabled, and are read rather than composed.
- [ ] `<instance>/<path>` is resolved through `artefactStub` + `siteDir`, with
      no literal instance segment anywhere in the pipeline.
- [ ] Question 1 is answered and, if it means moving cat-harness's docs, the
      move is planned rather than performed as a side effect.
- [ ] Bootstrap passes: its `.jsonld`/`.json` is addressable by the rule while
      it has no visualiser (`hfkl`).
- [ ] `check:instance-render` covers it, rather than a second check being
      written beside it.


---

## SCRAPPED as a duplicate of `o7eq` — 2026-09-20

`o7eq` ("URL SPACE: rendered assets mirror the instantiation structure") was
opened in a parallel session (`session_017PqeiS4JYySSWGAYLedmus`) from **the
same owner statement, quoted verbatim in both**, and landed on `main` in
ea22b5c7 before this branch merged. Two beans carrying one rule is two places
for it to drift, and the one on `main` is the one with the owner's rulings
already applied.

**Scrapped rather than deleted**, per `deletion-requires-confirmation` and
`bean-coordination`: a deleted bean leaves the next agent unable to tell
abandonment from accident, and this one is referenced from PR #583 and from
`xgd8`. It stays, marked, pointing at its replacement.

### What `o7eq` already settled, that this bean had as open questions

| this bean asked | `o7eq` answered |
|---|---|
| is cat-harness's `docs/` at `<base>/` case 1 or an exception? | **Case 1.** The root instance's just-the-docs site is `<baseurl>/`, and a registered rendered page of the root pipeline is `<baseurl>/<page>`. No move. |
| where is "registered" declared? | still open there too |
| what does `enabled: false` do? | **Enabled is a state whose default is enabled**, so "not rendered" must be a *declaration* rather than an absence — the three-state rule, stated |

And two rulings this bean did not have: the segment is the instance's **name**
(`cat-harness`), not its `stub` (`folio-assistant`); and the declared graph is
a **path segment** rather than elided, because an instance may declare more
than one renderable graph and they would otherwise collide on one URL.

### What this bean contributed that `o7eq` should keep

Two measurements made here, neither of them on `o7eq`:

- **`siteDir()` and `artefactStub()` are the two resolvers the rule needs**,
  and both already exist — `siteDir` returns `docs` relative to the instance
  root, and got SHORTER when `wggr` gave each instance its own directory.
- **`check:instance-render` is the conformance check this rule wants**, with
  its three states and "undetermined is never a pass" already built.
  Extending it is more likely right than writing a second.

### The first two consumers exist, and they conform

`schemas/` and `library/` now publish under this rule (PR #583). Both resolve
the rendered-content root through `siteDirFor` and take the published segment
from the DECLARED directory's own name, so neither writes an instance name or
a graph name down. Under `o7eq`'s ruling they are "a registered rendered page
of the root pipeline" at `<base>/schemas/` and `<base>/library/`, which is
case 2 and needs no change.
