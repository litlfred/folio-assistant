---
# folio-assistant-o7eq
title: 'URL SPACE: rendered assets mirror the instantiation structure — <baseurl>/ for the root, <baseurl>/<instance>/<path> for every enabled harness'
status: todo
type: feature
priority: normal
created_at: 2026-09-20T18:30:55Z
updated_at: 2026-09-20T20:03:22Z
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


## OWNER, 2026-09-20 — question 3 answered: the root's docs are INSTALLED

> root should have docs/ installed by cat-harness.

So the root does not need a segment of its own, and the apparent exception is
not one. Its `docs/` is not the root's own content — cat-harness installs it,
the same mechanism by which a dependent folio gets `uploads/` and `library/`.
The root is where an installed `docs/` is SERVED from, which is why it sits at
`<baseurl>/` with no segment.

That is now bean `n0nf`, with the measurement: the root has no `docs/` today,
the site builds from `cat-harness/docs`, and the `docs` entry declares
`dependents: "skip"` — which is precisely what stops a dependent, the root
included, from getting one.

### All three questions are now settled

| | ruling |
|---|---|
| name or stub | the instance's **`name`** |
| is the declared graph a path segment | **yes**, because an instance may declare more than one renderable graph |
| does the root get a segment | **no** — its `docs/` is installed by cat-harness and served at `<baseurl>/` |

### One consequence still open, and it is now sharper

The root's `name` is `folio-assistant` and cat-harness's `stub` is also
`folio-assistant`. Under this rule the root is addressed by that name, while
cat-harness publishes its graph at `<base>/folio-assistant.jsonld` from the
stub. Two different things now occupy one path space, and `n0nf` adds a third
question to it: if the root's `docs/` is installed from `cat-harness/docs/`,
the same page may be reachable at `<baseurl>/` and at
`<baseurl>/cat-harness/docs/`, and one of them has to be canonical.
Carried on `8xtj` with the other name mismatches.


## OWNER RULING, 2026-09-20 — three cases, and `docs/` has two roles at once

Three statements over one session, and the third reconciles the first two.
Asked whether `docs/` is a directory or a URL namespace, the owner answered
**"both are right."**

> cat-harness/docs/ exists and is iniated by cat-harness,
> /cat-harness/docs/who-iris/ would should show any docs/ assets in that
> sub-graph. this means docs/ is both a directory instiated by cat-harness as
> well as path to renderers/vsiualizers/managers/etc of its assets in the
> repos KG.. update harness kind expectations.

> b/c i also want special `<base-url>/who-iris` that mocks-up who's web
> interface

### The three cases

| # | URL | what it is | example |
|---|---|---|---|
| 1 | `<base>/` | the ROOT's rendering — its `docs/` is installed by cat-harness, so it is served at the top with no segment | the site a reader lands on |
| 2 | `<base>/<instance>/` | the instance presented **as itself**, on its own theme | `<base>/who-iris/` mocking WHO's web interface |
| 3 | `<base>/<owner>/<kind>/<subject>/` | a **viewer** of one instance's assets, rendered by another instance's machinery | `<base>/cat-harness/docs/who-iris/` |

### Why the earlier statements both held

Case 3 is `<owner>/<kind>/<subject>/`. Read from the left it is
instance-first; read from the segment that names the machinery it is
kind-then-instance. The two readings recorded earlier were the same path seen
from different ends, which is why neither could be refuted by the other:

- `<baseurl>/<instantiated harness>/<path_to_rendered_content>` — the owner
  and then what it renders
- `<base-url>library/who-iris` — the kind and then the subject

Both are case 3 with a different amount of the prefix written out.

### `docs/` has two roles, and that is the thing to model

1. **A directory** cat-harness instantiates, holding its own authored pages.
2. **A namespace for viewers** — `<owner>/docs/<subject>/` shows the
   docs-kind assets of *another* subgraph, rendered by the owner's machinery.

The same holds for `library/`, `fsh-guts/` and anything else an instance
declares: *"harnesses that instantiate a directory like fsh-guts, docs/
library/ need to create a visualizer for them."*

### What this changes in the schema — "update harness kind expectations"

`GraphKindDef` today answers two questions: `renderable` (does this become a
website) and `holds` (`content` / `context` / `state` / `derived`). Neither
can express case 3. A third axis is needed: **is this kind a viewer
namespace** — may `<owner>/<kind>/<subject>/` be composed for it, and which
instance owns the machinery that renders it.

Required rather than optional, for the reason `holds` is required: a kind
that has not decided should not compile. That is bean `o7eq`'s next step.

### Case 2 is goal 3's deliverable

`<base>/who-iris/` mocking WHO's own web interface **is** *"showing who-iris
with existing materialised assets with themed harness"* — milestone `yg29`.
It is not a routing detail; it is the goal.

---
---

---

## Its first two consumers exist — 2026-09-20, PR #583

`schemas/` and `library/` now publish under this rule. Both resolve the
rendered-content root through `siteDirFor` and take the published segment from
the **declared directory's own name**, so neither writes an instance name nor a
graph name down anywhere — `check:declared-paths` caught the first draft doing
exactly that and was right to.

### Their placement is NOT settled by the three-case ruling — open question

This note said they were "case 2, and need no change at all". **The three-case
ruling above supersedes that and the claim is withdrawn**, because the two
viewers are exactly the shape case 3 describes: cat-harness's machinery
rendering assets that belong to OTHER instances.

Measured on the merged tree: the schema viewer reads **4** declared `schemas`
directories (`cat-harness`, `folio-assistant-core`, `large-datasets`,
`detangle`) and the library viewer reads **3** (`who-iris`, `agent-skills`,
`folio-assist-sci`) plus three upload queues. So they are not the root
rendering its own content; they are one instance's viewer over several
instances' subgraphs — and they currently sit at `<base>/schemas/` and
`<base>/library/`, which is case 1's shape.

Three readings, and the owner has to pick:

1. **They stay where they are.** A viewer that spans every instance has no
   single `<subject>`, so case 3's path cannot be composed for it.
2. **They move to `<base>/cat-harness/schemas/`** — owner + kind, with the
   subject omitted because the view is the whole corpus.
3. **They split per subject** — `<base>/cat-harness/schemas/detangle/` and so
   on, with the current pages becoming an index over them. This is the reading
   that matches case 3 most literally, and it is the largest change.

**Nothing was moved on the strength of this**, because the generators compose
no path: `siteDirFor` resolves the rendered-content root and the segment is the
declared directory's own basename. Whichever reading wins, it is a change in
one place per generator rather than a rewrite.

Bean `8325` was opened in a parallel session from the same owner statement and
is now **scrapped** as a duplicate of this one, carrying two measurements worth
keeping: `siteDir()` + `artefactStub()` are the two resolvers this rule needs
and both already exist, and `check:instance-render` is the conformance check it
wants — three states, 'undetermined is never a pass' — so extending that is more
likely right than writing a second.


---

## OWNER, 2026-09-20 — `<subject>` is optional, and the segment is the PATH

Two statements, and the second corrects the shape the first was read into:

> `<base>/<owner>/<kind>/<subject>/`,,.. `<subject>` is not required behaviour.

> it `<baseurl>/<path to kind in knowledge graph>` or
> `<path to dir handled>/<optional subject>`

### What this settles

**A viewer's address is the repo-relative path of the directory it handles**,
with an optional `<subject>` below it. A viewer with no subject is the view
over ALL subjects.

So the three-case table above reads, for case 3:

| | |
|---|---|
| the handled directory | `cat-harness/schemas/` |
| its URL | `<base>/cat-harness/schemas/` |
| a per-subject page, if ever wanted | `<base>/cat-harness/schemas/<subject>/` |

### The correction inside the correction, and it is the part worth keeping

The first implementation **composed** the address from the rendering
instance's `name` plus the graph kind — `<owner>/<kind>`. That was written,
and it was wrong, and it passed its own test:

`cat-harness/schemas/` happens to SIT at owner/kind, so composition and
resolution give the same string for the one directory that was checked. They
diverge for every directory that does not: `who-iris/library/` would have been
published at `cat-harness/library` — **naming the machinery where the rule
names the data**, and silently, because the page would have rendered fine.

Taking the directory's path means the two can never disagree, because there is
only one of them. `viewerPlacement` is that single implementation, shared
between both viewers, with a test asserting the `who-iris/library` case
specifically — the case the composition got wrong.

### Applied

`schemas/` and `library/` moved from `<base>/schemas/` and `<base>/library/`
to `<base>/cat-harness/schemas/` and `<base>/cat-harness/library/`. Verified
by rendering both at the new URLs: zero console errors.

The page's link back to its projection is now **computed from the page's own
depth** rather than written. It had been a literal `../assets/…`, which keeps
parsing and fetches nothing the moment the page moves a level down — the exact
failure this move would have caused.

### Still open on this bean

Cases 1 and 2 are untouched here. `<base>/who-iris/` "mocking WHO's web
interface" (case 2) is a different artefact from `<base>/who-iris/library/`
(case 3, the viewer over who-iris's library) — and the two now share a prefix.
Whether that is a collision or a hierarchy is not settled by anything the
owner has said, and nothing in this work depends on it.

---

## `x0hj`'s residue, measured 2026-09-21 — and it folds into the OPEN QUESTION above

`x0hj` is the same owner message as this bean, filed four minutes earlier in a
parallel session. It was already marked *"superseded in substance"* by #584,
with one thing held back: a measurement of **three published artefacts that do
not follow the rule**, and the instruction *"do not scrap without checking
that"*. Checked, on today's main, with #584 merged:

| artefact | where the build puts it | verdict |
|---|---|---|
| `_site/fsh-guts.jsonld` | `docs-site.yml:301` | **not a defect** — the owner asked for it by name: *"jsonld accessible via `<base-url>/fsh-guts.jsonld`"*. A second document precisely so a crawler never arrives at it, with `UNPUBLISHED_GRAPH_KINDS` stripping it from every other graph |
| `_site/folio-assistant.jsonld` | `docs-site.yml:279` | see below |
| `_site/folio-assistant/index.html` | `docs-site.yml:281` | see below |
| `_site/bootstrap/bootstrap.jsonld` | `docs-site.yml:362` | **conforms** — and it is this bean's own worked example |

### The two that remain are not an instance's rendering at all

Both take their name from `STUB=$(print-stub.ts ./cat-harness)`, which resolves
to **`folio-assistant`** — and `artefactStub` is documented as *"the
REPOSITORY's short name, used as the filename stem of every artefact… so a
reader who knows the repo knows the filename"*. So `<STUB>.jsonld` is the
**repository's** union graph, not the `cat-harness` instance's rendering
published under a confusing name.

That makes them the same shape as this bean's §"Their placement is NOT settled
by the three-case ruling": an artefact that **spans instances** and therefore
has no single `<subject>` to compose a path from. The schema viewer reads 4
declared `schemas` directories and the library viewer 3 — and the repository
graph reads all 12.

**So the residue is not a separate bean. It is two more rows under the open
question already on this one**, and whichever of the three readings the owner
picks should be applied to them at the same time. Splitting it would mean
asking the same question twice and risking two answers.

### What genuinely remains open, restated with these included

Five artefacts, one ruling:

| | spans | composed today as |
|---|---|---|
| schema viewer | 4 instances | `<base>/schemas/` |
| library viewer | 3 instances + 3 queues | `<base>/library/` |
| repository KG | 12 instances | `<base>/folio-assistant.jsonld` |
| repository KG viewer | 12 instances | `<base>/folio-assistant/index.html` |
| `.json` aliases of both | — | follow whatever the above do |

`blv9` — an `@id` must move with the file that carries it — is unchanged by any
of this and is still the thing to gate whichever reading wins. **Nothing was
moved**: the generators compose no path, so a change is one line per generator.
