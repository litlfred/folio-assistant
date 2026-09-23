---
layout: default
title: 'Render order'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/render-order.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/render-order.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/render-order.md){: .fa-edit-source }

{% raw %}
# Render order — flattening a dependency hierarchy, and the two stages

Two things live here, and they are deliberately one skill: **the general
subprocess** (flatten a hierarchy into one order) and **the one pipeline this
repository runs with it**. The owner asked for the second and then generalised
it in the same breath:

> readme epid need to flattening of depndency hieracy, rulles + tools. as do
> other skills. this is a repeable subprocess

**A repeatable subprocess has one implementation.** Four callers each wanting
"run these in dependency order" is four topological sorts, three of them
subtly different and none tested.

| | |
|---|---|
| the rules + the flattener | `cat-harness/schemas/dependency-order.ts` |
| the pipeline that uses it | `cat-harness/scripts/render-pipeline.ts` |
| see the order without running it | `bun run render:order` |
| run it | `bun run render` |

## The four rules, and each is a decision rather than a default

1. **A node runs after everything it declares `needs`.** Nothing else implies
   order — not position in the list, not the id.
2. **Ties break on declaration order.** Sorting ties alphabetically makes the
   flattened order churn when a node is renamed, turning a no-op rename into a
   pipeline diff nobody can read.
3. **A cycle is reported, never broken.** Breaking one picks a winner silently
   and the pipeline then runs in an order nobody chose. **Every** node in the
   cycle is named — naming one sends the reader to fix the wrong edge.
4. **A missing dependency is reported, never dropped.** `needs: ["x"]` with no
   `x` is a claim that failed. Running the node anyway reports a clean pass
   over a broken graph, which is the `dh4f` defect in ordering form.

Rules 3 and 4 share a consequence worth stating on its own: **a broken graph
yields NO order at all**, not a partial one. A partial order over a broken
graph is the thing that gets run.

## `fatal` is per STEP, and it is required

The owner's design, on the render pipeline:

> current state of KG renderered as json/jsonld failuer = fatal, readme updated
> faliure = fatal , dynamic parts (kg vierwe, visaluzers, etc) render in
> flattened depndency order, failures = skip/log/qa or so

So the runner cannot own one policy — two steps must stop the build and the
rest must not. The field is **required rather than defaulted**, for the same
reason a graph kind must state `holds`: a default lets a step ship without
anybody deciding, and the two policies are not interchangeable.

**A failure skips what NEEDED it**, computed transitively from `needs` — not
what merely follows it in the list. Two steps can be adjacent and unrelated,
and skipping an unrelated one loses a rendering for no reason. A skipped step
names the step that **broke**, not the nearest blocked neighbour.

### Three outcomes, and `pending` is the third

`ran`, `failed`, `skipped` — plus a step that is **declared but not yet
performable**, which the report marks `◻` and never a tick. It exists because
the first draft did not have it: the bootstrap step was written as
`kg-export --root bootstrap`, and `kg-export` has no `--root` flag. The
argument would have been ignored and the whole graph exported under
bootstrap's name — **a step reporting success while doing something else.**
Naming the gap costs a line; finding it from a wrong artefact costs a release.

## The two stages

| stage | renders | on failure |
|---|---|---|
| 1 | the CURRENT declared state as json/jsonld, then the README from it | **fatal** |
| 2 | the dynamic parts — viewers, visualisers, doc pages, diagrams | skip + log + QA |
| 3 | the DYNAMIC state, exported once stage 2 has contributed | **fatal** |

**Two exports, not one**, and that is what resolves what reads as a
contradiction — *"json/jsonld rendered last as intermeridaay renderes may add
to dynamic KG"* against *"current state of KG renderered as json/jsonld …
fatal"*. They are different documents. The first is what the declarations say
now; the second is what the graph became after the renderers ran.

**Stage 1 is fatal because everything below is derived from it.** A knowledge
graph that does not render is not a degraded build, it is an unknown one, and
a README generated from a half-read graph states a wrong fact in the file a
reader opens first. **Stage 2 is not**, because a missing visualiser costs one
rendering and nothing else.

**Bootstrap is the exception, and it is declared as one.** It depends on
nothing and nothing depends on it — that is what "as an exception" means here:
bootstrap is read when no harness is installed, so it cannot wait on the
graph and the graph must not wait on it. Same shape as its exemption from the
`visualiser` criterion in `check:subgraph-coverage`, and a **second criterion
rather than a hole**: it owes its own `.json`/`.jsonld` instead (bean `hfkl`).

## What stage 3 writes is not settled, and is not guessed

The owner named it *"cat-harness/state.jsonld or so (whatever matches the
dyanmic state vsualizesrs)"* — an explicit uncertainty. **The step's position
is fixed; its output filename is not.** It is settled when the dynamic-state
visualisers say what they read, and until then the step re-exports the graph
the stage-2 renderers contributed to, which is the part of the description
that was never in question. Do not mint a published artefact name to close a
gap the author left open.

## This declares the order; `docs-site.yml` still publishes

`render-pipeline.ts` is not a second CI workflow. It holds the order and the
policy in one readable, testable place and gives CI one thing to call. **A
pipeline order that exists only as the sequence of steps in a YAML file is an
order nobody can test** — bean `xom7` is what a workflow's behaviour costs when
the repository holds no statement of it.
{% endraw %}
