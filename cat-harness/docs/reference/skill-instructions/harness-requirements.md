---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Harness requirements'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/harness-requirements.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/harness-requirements.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/harness-requirements.md){: .fa-edit-source }

{% raw %}
# Harness requirements — what an instance owes for what it declares

**Declaring a directory is a promise.** It says this instance holds a graph of
that kind, and a consumer may scan it. The obligations below are what makes
that promise keepable: a reader can look at it, a reader can read about it, and
an agent is handed something that governs it.

The axis that measures them is `bun run check:subgraph-coverage`. This skill is
how to read it and what to do before adding to it.

## The five obligations

| obligation | declared as | the question it answers |
|---|---|---|
| **visualiser** | `coverage.visualiser` on the directory entry | can a person LOOK at this? |
| **docs** | `coverage.docs` | can a person READ ABOUT this? |
| **skill** | `coverage.skill` | is an agent handed something that GOVERNS this? |
| **serialisations** | `coverage.serialisations` | is each node ADDRESSABLE as json, jsonld and schema.json? |
| **README** | an `instance-readme` asset, inside the instance | can a reader ENTER this instance at all? |

The first four are per declared directory. The fifth is per instance, and it
is ranked harder: an instance with no starting README of its own is not a gap
somebody has not filled, it is an instance a reader cannot enter.

## An unmet obligation is not an unanswered question

The axis ranks two things apart, and the distinction is the whole point of
having severities at all:

- **major** — an obligation this kind OWES and the instance has not met, or a
  target declared and not resolving. Somebody promised something.
- **minor** — nobody has said yet, for a kind that never owed one.

Merging them would rank `beans/` having no viewer alongside a kind that was
never going to need one, and an axis that cannot tell those apart is an axis
whose count means nothing.

### Which kinds owe a visualiser

The owner, 2026-09-20:

> if there is active state directory in repo root/ (**not part of the static
> KG**) like `beans/`, `todos/`, `fsh-guts/` those have their vuisalizers too
> as requiement of handler.... needs to render sometihng for each "state" dir
> it declares/inits

**The discriminator is the parenthetical: is this the static knowledge graph,
or is it active material about the work?** Authored subject matter you can read
as itself. A record of where something got to, you cannot — which is why it
needs something that renders it.

That is `holds !== "content"`, and the wording is not a coincidence: `content`
is defined as *"authored nodes a reader or a tool consumes as the subject
matter… It stands on its own"*. A graph that stands on its own needs no viewer
to be legible. Everything else does. `owesVisualiser()` in
`schemas/cat-harness.ts` is that sentence as code.

### The rule this is NOT, and the ten minutes that proved it

The first derivation was **`holds === "state"`**. It is wrong, and the way it
failed is the reason this section exists.

It covers `beans` and `todos` and **misses `fsh-guts`**, which the owner names
in the same sentence — because bean `mhh9` reclassified `fsh-guts` from `state`
to `context` *earlier the same day*, on the ground that no running step writes
it: relocating something there is a human-directed act.

So a rule keyed on `state` would have silently stopped requiring a visualiser
for a directory the owner had just named, at the moment an unrelated
classification changed. **That is the worst failure available here** — the
obligation disappears and nothing reports that it did.

`holds !== "content"` survives that move, because `state` and `context` are on
the same side of it. **The test any rule over this axis must pass: a kind
changing category within the non-content layers must not change what it owes.**

### Two exemptions, and they are different shapes

**`renderable` kinds are exempt by construction.** `docs` and `folio` render to
pages, so the pages ARE the view and a separate viewer would be a second
rendering of the same thing.

**Bootstrap is exempt by INSTANCE, not by kind.** `hfkl` carries the ruling
that `bootstrap` has no visualiser *"but it must have its json/jsonld…
that is its existence"*. Keyed on the instance name, so every other instance
declaring the same kind keeps the obligation — and it is a **second criterion,
not a hole**: an axis that dropped bootstrap by kind would stop checking the
one thing bootstrap must have.

**An unknown kind owes one.** The default is the strict side, for the reason
`DOCUMENT_BLOCK_KINDS` is a derived complement rather than a list: a kind
nobody has classified must not escape an obligation by being unmentioned.
Note this is the opposite collapse from `graphLayer()`, whose `undefined`
callers must *not* read as `content` — there the unknown must stay unknown,
here it resolves to the obligation. Both choose the direction that fails safe.

## Where a visualiser is published

Rendered content is addressed by the three cases on bean `o7eq`:

| # | URL | what it is |
|---|---|---|
| 1 | `<base>/` | the ROOT's rendering — its `docs/` is installed by cat-harness, so no segment |
| 2 | `<base>/<instance>/` | the instance presented **as itself**, on its own theme |
| 3 | `<base>/<owner>/<kind>/<subject>/` | a viewer of one instance's assets, rendered by another's machinery |

Case 3 is why `docs/` has two roles at once — the owner, asked which it was,
answered **"both are right"**. It is a directory cat-harness instantiates AND a
namespace under which the docs-kind assets of another subgraph are rendered:
`<base>/cat-harness/docs/who-iris/`.

So "which directory holds it" and "which URL serves it" are different
questions, and a visualiser's declaration answers the first. Do not compose the
second by hand — that is what produced four incompatible URL shapes across four
open branches on 2026-09-20.

## Serialisations — the obligation that cannot be waived

The owner, 2026-09-20, in two rulings that belong together:

> all dir urls should have json, jsonld, schema.json like
> `<base-url>/beans.jsonld`

> also subpaths must remain addressable… like `<base-url>/beans/bean-id.jsonld`,
> json and schema etc if there, harnesses cannot override there being in the KG

So a declared directory owes **two levels** of addressability, and they are
different promises:

| level | URL | what it asserts |
|---|---|---|
| the directory | `<base>/beans.json`, `.jsonld`, `.schema.json` | this graph exists and here is its shape |
| every node in it | `<base>/beans/<node-id>.json`, `.jsonld`, `.schema.json` | each node is individually in the graph |

**"if there" is doing real work in that sentence.** A node that carries no
schema does not acquire one by being published; the rule is that whatever the
node HAS is reachable, not that a missing form is invented. A `.schema.json`
that 404s where no schema exists is honest. A `.jsonld` that 404s where the
node exists is the defect.

### Why this one takes no `exempt`

Every other obligation here is waivable with a reason, because rendering,
documenting and governing are choices about **effort** and a considered
exception is worth recording. This one is not waivable, and the wording of the
ruling says why: *harnesses cannot override there being in the KG.*

Addressability is not effort, it is the **existence claim**. A harness that
could waive it could declare a directory into the knowledge graph and then make
its contents unreachable — which is the `dh4f` defect with a signature on it, a
consumer scanning nothing and reporting a clean run over it.

**`hfkl` is the proof rather than the exception.** `bootstrap` is excused a
visualiser — *"it is exception to harness/layer not having visualtion/workflow
visualizer. but it must have its json/jsonld… that is its existence."* The
thing it is excused INTO is this obligation. A floor that the one exempt case
is exempt *to* cannot itself be exempt from.

So: **the visualiser is the courtesy, the serialisation is the existence
claim.** `SubgraphCoverageSchema.exempt` carries three keys and not four, and
`tsc` enforces it — adding `serialisations` to `CRITERIA` turned the checker's
waiver lookup into a type error rather than a silent `undefined` that would
have read as "not exempted" and worked by luck.

### How it fits the render pipeline

The pipeline the sibling branches are converging on is four parts per graph —
**reader → projection → viewer → gate** (PR #583 for `schemas/` and `library/`,
this branch for the state graphs). The serialisation obligation is a
constraint on the **projection**, not a fifth part:

- a projection already exists for every browsable graph, and it is already
  published under the graph's own segment;
- what this adds is that it must be reachable by the three content types at
  the directory's URL, and per node beneath it;
- so a graph that has done the pipeline work has mostly done this, and a graph
  that has not cannot claim to be in the KG at all.

**Do not compose these URLs by hand.** `o7eq` records that hand-composition
produced four incompatible URL shapes across four open branches on a single
day. The directory's declaration answers which directory holds the nodes; the
published-URL resolver answers where they are served.

## Before you declare a directory

1. **Say what renders it, documents it and governs it**, or say why it needs
   none — `coverage.exempt.<criterion>` takes a reason, and a waiver with no
   reason is a silence list.
1. **Say what serialises it**, and do not look for a waiver: there is none.
   A directory whose nodes are not addressable has not entered the graph.
2. **Declare only what exists.** A declared-but-absent directory is the `dh4f`
   defect: a consumer scans nothing and reports a clean run over it.
3. **Check the kind's layer.** If it is not `content`, you are promising a
   visualiser, so know who is building it before the declaration lands.

## Before you add a graph kind

`GraphKindDef` requires `renderable` and `holds`, so a kind cannot go
unclassified — that is deliberate and `tsc` enforces it. What it does **not**
carry is the visualiser obligation, because that is derived rather than
declared, for the `fsh-guts` reason above.

So: set `holds` on what a running process DOES with the graph, never on what
you would like the obligation to be. Getting `holds` right is what makes the
obligation right.

## Reading the axis

It is **advisory** — it reports, ranks and exits 0. That is not softness:
0 of 20 non-content directories have a declared visualiser today, and a hard
gate on day one is a wall somebody switches off. It becomes fatal when the
count is low enough to mean something, the same path `undeclared` took in
`check-instance-render`.

Three rules for reading it, the same three every sweep here follows:

- **`undetermined` is never a clean run.** An unreadable declaration is
  reported as such; a sweep blind on one instance has not cleared the others.
- **Never quote a count from prose.** The numbers in this file are from
  2026-09-20 and are provenance for the rules, not a description of today.
  Run it.
- **A finding is not a task list.** The four obligations belong to whoever
  declared the directory, and `deletion-requires-confirmation` applies to every
  remedy that removes something.

## See also

- [`directory-conventions`](directory-conventions.md) — the declaration schema
  and every graph kind
- [`content-context-and-state-graphs`](content-context-and-state-graphs.md) —
  what `holds` means, and the one question that settles a kind
- [`kg-viewer`](kg-viewer.md) — the viewer this repository already ships
- `bun run check:subgraph-coverage` — the axis; `schemas/cat-harness.ts`
  `owesVisualiser()` — the visualiser obligation, and
  `SubgraphCoverageSchema.serialisations` — the one that takes no waiver
- [`url-space`](../../../beans/defs/) — bean `o7eq` for where a rendered
  asset is addressed, and why not to compose that URL by hand
{% endraw %}
