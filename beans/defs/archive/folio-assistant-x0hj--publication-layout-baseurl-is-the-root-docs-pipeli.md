---
# folio-assistant-x0hj
title: 'PUBLICATION LAYOUT: <baseurl>/ is the root docs pipeline, <baseurl>/<instantiated harness>/<path> is everything else'
status: scrapped
type: task
priority: normal
created_at: 2026-09-20T18:26:35Z
updated_at: 2026-09-21T10:40:17Z
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
   `<baseurl>/bootstrap/bootstrap.jsonld`, which the owner names as the
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
| `_site/bootstrap/bootstrap.jsonld` + `.json` | bootstrap | **yes** — the owner's own example |
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
build published `bootstrap/ns.jsonld` while the graph's `@id` named
`bootstrap/bootstrap.jsonld`, so the artefact whose entire purpose is
being dereferenced resolved to nothing — for months, with the generator working
perfectly. A layout change that moves a file without moving what names it
reproduces that bug at scale.

`cat-harness/scripts/tests/bootstrap-graph.test.ts` already carries the
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
      way `bootstrap-graph.test.ts` gates its one

---

## SUPERSEDED IN SUBSTANCE — the owner corrected the rule, and it is already built

Found 2026-09-20 by reading sibling PRs rather than by being told. **This bean
records the owner's FIRST statement of the rule; they corrected it in another
session, and the correction is implemented on `claude/determined-euler-gqhkk0`
(PR [#584](https://github.com/litlfred/folio-assistant/pull/584)).** Leaving
this bean as written would have sent the next agent to build the superseded
form.

The correction, quoted from that branch's commit message:

> First: `<baseurl>/<insantiated harness>/<path_to_rendered_conentent>`.
>
> Then the correction, which is the one implemented: *"your right... it should
> be `<base-url>library/who-iris`. note rule on harnesses that instantiate a
> director like fsh-guts, docs/ library/ need to create a visualize for them"*,
> and the form: `<path-to-kind-or-node>`.
>
> So the mount point is keyed on the GRAPH KIND, not the instance alone:
> `<base-url>/<kind>/<instance>/`

**Keying on the instance alone — which this bean records — collapses every kind
an instance declares onto one path**, so a folio with both a library and its
own docs could publish only one of them. That is the defect, and it is exactly
the shape of the two-instances-one-name collision `#477` already paid for, one
layer out.

### Two of this bean's open questions are answered by that work

- **"Does the root instance get a segment TOO?"** — No. PR
  [#583](https://github.com/litlfred/folio-assistant/pull/583) records the
  owner's ruling: *"the root gets no segment, since its `docs/` is installed by
  cat-harness and served at `<baseurl>/`"*. So statement 1 of this bean stands
  unchanged and the two viewers need no change at all.
- **"Which string is the segment"** — moot in the form this bean asked it, since
  the first segment is now the KIND. The instance is the second, and `who-iris`
  landing at `/docs/who-iris/` and `/library/who-iris/` is the worked example.

### And a collision rule this bean did not have

That branch also implements what happens when two instances claim one path:
**walk from the root, outermost wins, stop** — the opposite of longest-prefix
routing, and right for the reason given there: a mount point is a claim on a
SUBTREE, so a deeper handler punching through would mean the outer instance's
index could not be trusted to describe what is under it. A losing claim is
REFUSED with its owner named and the step exits non-zero, rather than `cpSync`
writing one instance's page over another's and exiting 0.

### What is left of this bean

The **measurement**, which stands and is not in that branch: three published
artefacts already follow the rule and three do not —
`_site/<STUB>.jsonld`, `_site/<STUB>/index.html` (the KG viewer, prefixed by
`folio-assistant` rather than by kind and instance) and `_site/fsh-guts.jsonld`.
Under the corrected rule those become `<kind>/<instance>` questions rather than
`<instance>` ones, and the `@id`-moves-with-the-file hazard (`blv9`) is
unchanged and still the thing to gate.

**Do not scrap without checking that.** Whoever picks this up should read #584
first, then decide whether the residue is a bean or a line on that branch's.

---

## Reasons for Scrapping — 2026-09-21

**The check this bean asked for has been done.** Its last line said *"Do not
scrap without checking that"* — the residue measurement — and *"read #584
first, then decide whether the residue is a bean or a line on that branch's"*.

**#584 is merged.** The corrected rule (`<base-url>/<kind>/<instance>/`, and
the collision rule *walk from the root, outermost wins, stop*) is on main, with
`renderingPath` as the composer and `check:instance-render` as the conformance
check — **12 rendered, 0 failed, 0 undetermined** on today's tree.

### The residue, measured rather than assumed

| artefact | verdict |
|---|---|
| `_site/fsh-guts.jsonld` | **not a defect.** The owner asked for it by name — *"jsonld accessible via `<base-url>/fsh-guts.jsonld`"* — and it is a second document precisely so a crawler never arrives at it |
| `_site/folio-assistant.jsonld` | the REPOSITORY's union graph, not an instance rendering |
| `_site/folio-assistant/index.html` | its viewer, same |

Both of the latter take their name from `artefactStub`, documented as *"the
REPOSITORY's short name, used as the filename stem of every artefact"*. They
span all 12 instances, so they have no single `<subject>` to compose a path
from — which is **exactly** the open question already sitting on `o7eq`
(§"Their placement is NOT settled by the three-case ruling"), where the schema
viewer spans 4 instances and the library viewer 3.

### So the residue is a line on `o7eq`, not a bean

It has been written there, as two more rows under that question, with the
five-artefact table one ruling now covers. Splitting it would mean asking the
owner the same question twice and risking two answers.

**Scrapped, not deleted**, per the never-delete rule: a scrapped bean stops the
next agent re-entering a dead end, while a deleted one leaves a sibling unable
to tell abandonment from accident. Nothing here is lost — the superseded-rule
analysis stays readable above, and the live question is on `o7eq`.

`blv9` (an `@id` must move with the file that carries it) is untouched by any
of this and remains the thing to gate.
