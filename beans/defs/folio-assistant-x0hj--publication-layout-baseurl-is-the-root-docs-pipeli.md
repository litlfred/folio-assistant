---
# folio-assistant-x0hj
title: 'PUBLICATION LAYOUT: <baseurl>/ is the root docs pipeline, <baseurl>/<instantiated harness>/<path> is everything else'
status: todo
type: task
created_at: 2026-09-20T18:26:35Z
updated_at: 2026-09-20T18:26:35Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20, verbatim — the layout is specific enough that a paraphrase
would lose which segment comes from where:

| rendered assets should be available at toplevel like <baseULR>/ for main jsut
| the docs pipleline, or <baseurl>/<page> where is registered rendered page from
| a harness that was instantiated and enbaled (by default enabled) realtivg to
| their url, so <baseurl>cat-harness/docs or so... <baseurl>/<insantiated
| harness>/<path_to_rendered_conentent> , bootstrap jsonld/json is example

## The rule, as three statements

1. **`<baseurl>/` is the ROOT instance's docs pipeline, and only that.** The
   site root is not a dumping ground for whatever a build happens to emit; it
   is one instance's rendering.
2. **Everything else is `<baseurl>/<instantiated harness>/<path to rendered
   content>`.** The segment is the INSTANCE, and the path beneath it is that
   instance's own rendering — so `<baseurl>/cat-harness/docs`, and
   `<baseurl>/cat-bootstrap/cat-bootstrap.jsonld`, which the owner names as the
   worked example.
3. **Registered, instantiated and ENABLED, enabled by default.** A harness gets
   its URL segment by being instantiated, which is the same act that gets it a
   slot in the LHS navbar (`b5f0`: *"instantiating a harness means that you get
   a slot in the LHS navbar"*). `enabled` is a THIRD state beside instantiated
   and not — default true, so nothing has to opt in, and a disabled instance
   publishes nothing rather than publishing a 404.

So the URL layout and the navbar are **one structure rendered twice**: the
navbar section for an instance and the URL prefix for that instance are the
same fact. Filed under `yj32` with the rest of the
interface work, and it is **`b5f0`'s other half**: `b5f0` says instantiation
buys you a navbar slot, this says the same act buys you a URL prefix. The two
must be one answer — a harness in the navbar and not at a URL, or the reverse,
is a rendering nobody can link to. Filed here rather than as a child of `b5f0`
because beans refuses a task under a task, and `b5f0` is one.

## Measured against `.github/workflows/docs-site.yml`, 2026-09-20

The rule is **already true for two things and false for three**, which is the
useful state: there is a precedent to follow rather than a design to invent.

| published at | belongs to | matches the rule? |
|---|---|---|
| `_site/` (Jekyll) | the root docs pipeline | **yes** — statement 1 |
| `_site/cat-bootstrap/cat-bootstrap.jsonld` + `.json` | cat-bootstrap | **yes** — the owner's own example |
| `_site/<DIR>/ns.jsonld` for all three layers | each layer | **yes** |
| `_site/<STUB>.jsonld` + `.json`, STUB = `folio-assistant` | **cat-harness** | **no** — at the root, and named `folio-assistant` rather than `cat-harness` |
| `_site/<STUB>/index.html` — the KG viewer | **cat-harness** | **prefixed, but by the wrong name**: `<baseurl>/folio-assistant/`, not `<baseurl>/cat-harness/` |
| `_site/fsh-guts.jsonld` + `.json` | the `fsh-guts` graph | **no** — at the root |

**The naming collision is the sharp part and it is not cosmetic.**
`cat-harness/harness.json` declares `name: folio-assistant`, `stub:
folio-assistant`, so cat-harness's artefacts publish under the REPOSITORY's
name. Under this rule the segment must be the instance, and there are then two
candidate answers for cat-harness — `folio-assistant` (its declared name) and
`cat-harness` (its directory). The owner wrote `<baseurl>cat-harness/docs`.
Reconciling those is the first question, and it is the same question `b5f0`
raises about `<declared instance name>.config.json`: **what is an instance's
name, and is it the same string everywhere it appears?** Settle it once.

## Why moving an artefact is expensive, and what protects it

Every `@id` in a published graph is minted against `canonicalUrl`. Moving
`<STUB>.jsonld` from `<baseurl>/folio-assistant.jsonld` to
`<baseurl>/cat-harness/...` changes every IRI in the largest graph this
repository publishes, so it is a redirect question as well as a path question.

**The failure to design against is `blv9`**, which is exactly this shape: the
build published `cat-bootstrap/ns.jsonld` while the graph's `@id` named
`cat-bootstrap/cat-bootstrap.jsonld`, so the artefact whose entire purpose is
being dereferenced resolved to nothing — for months, with the generator working
perfectly. A layout change that moves a file without moving what names it
reproduces that bug at scale.

`cat-harness/scripts/tests/cat-bootstrap-graph.test.ts` already carries the
guard shape worth copying: it asserts the `@id` against the **workflow's
`--out` path**, because a build that runs the generator and writes it elsewhere
leaves the link dead just as surely as one that never runs it.

## Open, and genuinely the owner's

- **Which string is the segment** — the declared `name`, the `stub`, or the
  directory? `cat-harness` vs `folio-assistant`, above.
- **Where does `enabled` live** — `harness.json` (the declaration) or
  `harness.config.json` (the config)? Same fork `b5f0` is stuck on.
- **Does the root instance get a segment TOO**, in addition to serving
  `<baseurl>/`? Two URLs for one rendering is a canonical-link question.
- **What happens to `fsh-guts`** — it is a graph kind rather than an instance,
  and the rule as stated has no slot for one.

## Done when

- [ ] The rule is written down where the site build and the navbar both read
      it, rather than being reimplemented in each
- [ ] `<baseurl>/<instance>/<path>` holds for every published artefact, or the
      exceptions carry reasons
- [ ] `enabled` is declared, defaulted true, and a disabled instance publishes
      nothing — tested in BOTH directions
- [ ] No `@id` moves without the thing that names it moving with it, gated the
      way `cat-bootstrap-graph.test.ts` gates its one
