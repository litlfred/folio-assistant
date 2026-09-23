---
name: graph-rendering
description: >-
  Draw any graph in a harness (schemas, processes, a paper's block graph, a
  Lean proof's dependencies, a detangle partition) so the picture is derived,
  checkable and readable. Ten rules learned on the UML overview, which engine
  to lay a graph out with and why, and how each graph kind here applies them.
capability: architecture
package: graph-management
---

# Graph rendering: one set of rules for every drawn graph

> Skill id: `graph-rendering` · Capability: `architecture` · Package: `graph-management`

This repository draws graphs in at least six places, and until this skill each
one followed its own conventions. Owner, 2026-09-23 (issue #1137): *"make
skill that applies to graphs in general.... then apply to papers, schemas,
math proofs/lean etc"*.

This skill is the general part. It says what any drawing of a graph owes its
reader. The per-graph skills say how one generator meets it:
[`uml-overview`](../folio-core/uml-overview.md) for schemas,
[`bpmn-authoring`](../workflow/bpmn-authoring.md) for processes, and
[`content-graph`](../folio-core/content-graph.md) for a paper's blocks.

A drawing is how a person READS a graph. [`graph-detanglement`](graph-detanglement.md)
is how the graph is RESTRUCTURED, and it needs the drawing: a partition you
cannot see is a partition you argue about from numbers alone.

## The ten rules

Each rule was learned on the UML overview (issue #990). The failure each one
prevents is stated beside it.

1. **Draw from a declared graph, never by hand.** Every node and edge in the
   picture is read from a source: a schema, a declaration, a BPMN file, a
   `uses[]` list, a Lean dependency cache. A wrong picture is fixed at its
   source. A hand-edited diagram is overwritten on the next run, and a check
   fails while it is stale.
2. **Groups are declared sub-graphs.** A box around nodes is a named
   sub-graph (a `directories[]` entry, a chapter, a package), never a
   grouping the renderer invented. Owner, 2026-09-23: *"sections are
   sub-graphs in a harness"*.
3. **No empty box without a reason.** A node drawn with nothing in it reads
   as a rendering fault; the owner asked *"why empty?"* of exactly that. A
   node with no fields to show carries one line saying why. A node whose
   shape could not be determined is drawn dashed, as a finding, never as a
   quiet empty shape. The UML overview went from 242 empty boxes to 0.
4. **Edge kinds are drawn distinctly and never merged.** A graph has more
   than one kind of edge ([`edge-kinds-and-blast-radius`](edge-kinds-and-blast-radius.md)).
   Editorial `uses[]` and formal Lean edges, enforced and prose-only
   references, and a field-carried link versus one declared elsewhere (the
   UML's dashed `folio:skill` edge) each get their own line style and a
   legend. Merging two kinds into one line destroys the signal every metric
   on that graph is computed from.
5. **Pick the layout engine by what the graph is, and write down why.**
   See §"Layout engines" below. The choice is a claim with a measurement
   behind it, not a taste.
6. **Offer two orientations from one source.** A tall graph on a wide screen
   and a wide graph on a phone are both unreadable. Derive the second view
   from the first (`landscapeOf` in `scripts/plantuml-render.ts`) rather than keeping
   two sources that can drift apart. Owner: *"can we have portrait and
   landscape views?"*
7. **Declare colour once.** Colour a node by its family (for the UML: schema,
   scenario, process, state, test) in one stylesheet, and have every renderer
   read that stylesheet (`uml-palette.ts`). A second palette is a second answer
   free to disagree with the first.
8. **Stamp the output with its source's hash.** A rendering whose staleness
   check needs the renderer is a check CI cannot run: Java, a browser, or a
   font set that measures text a pixel differently. Write the sha256 of the
   exact source text into the output and compare stamps. The UML and
   block-graph SVGs do this through `scripts/plantuml-render.ts`, which every
   PlantUML generator shares, with its pinned jar and one JVM for all diagrams.
9. **Show it in a zoomable figure.** On the site, use the `bpmn-figure`
   markup so `docs-ui.js` adds zoom, reset and full-width controls. A pages
   template missing `layout: default` renders with no site script and so no
   controls, and nothing reports it.
10. **Put the measurement on the drawing.** When a graph is being partitioned,
    show each group's detangle numbers (size, cohesion, links in and out)
    beside the group, so the picture and the metric are read together. The UML
    overview pages do this through `detangleResultsDir` (`schemas/detangle-sidecar.ts`),
    the same function the detangler writes through. A number shown without its
    picture invites arguing about the number.

## Layout engines

Measured on the UML overview, 2026-09-23. Re-measure before relying on it for
a different graph.

| engine | use it for | what it gets wrong |
|---|---|---|
| **stored layout** (BPMN DI) | a graph whose author placed the nodes | nothing to choose: never re-lay a graph that carries its own layout |
| **ELK** (`!pragma layout elk` in PlantUML) | the compact, portrait default; it routes edges around boxes | it lays everything top to bottom and **ignores `left to right direction` and arrow hints** (output byte-identical). Unconnected groups end up in one wide row. |
| **ELK + hidden links** | a grid of unconnected groups (an overview) | nothing, if the column count suits the orientation: `ceil(√(n/2))` for portrait, `ceil(√(2n))` for landscape |
| **Graphviz dot, left to right, polyline edges** | the landscape view of a connected graph | it can route a long edge across a box, which is why ELK stays the portrait default. Use `nodesep 70`, `ranksep 160`. |
| Graphviz with **orthogonal** edges | avoid | it places edge labels away from their edges and runs lines through boxes. The owner: *"make wider, its messy"*. |
| Mermaid (dagre) | a secondary view where CSS classes on nodes matter | the same model came out three times taller than ELK's |

## Applying it

| graph | source | groups | edge kinds | renderer today | owes |
|---|---|---|---|---|---|
| **schemas** | graph-kind registry, Zod schemas | `<instance>/<sub-graph>` | composition; field-carried vs declared elsewhere | `gen-uml-overview.ts`, `gen-object-model-uml.ts` | meets all ten |
| **processes** | `.bpmn` files | pools and lanes | sequence, message, call | `render-bpmn.ts` (stored layout) | rule 6 (orientation) does not apply: the author placed it |
| **paper blocks** and **Lean proofs** | `buildContentGraph` in `content/pipeline/content-graph.ts`; status from `proof-objects.json` | chapters | `editorial` (`uses[]`, `interprets`), solid, vs `formal` (Lean `type` / `value`), dashed purple | `gen-content-graph-uml.ts` (Tool `content-graph-uml`), run from a folio | meets rules 1 to 8. Rule 9 waits on a folio page to show it; rule 10 on detangle scanning a paper |
| **detangle partition** | the sidecars under `detangleResultsDir` | detangle groups | enforced / recorded / prose | numbers only; the UML pages show them (rule 10) | a drawing of the cross-group edges themselves |

A paper or a Lean project is **content**, and content lives in a folio
repository, not here. Apply the rules there through the platform's generator,
and ask the owner before a PR in a mathematics repository.

**Papers and Lean are one drawing, not two.** `buildContentGraph` already holds
both relations over the same blocks, so `gen-content-graph-uml.ts` draws them
together and keeps them apart by line style. The two drawings it supersedes
each re-parsed the sources and drew only one relation:
`content-graph-analysis.py` (blocks) and `.github/scripts/generate_dependency_graph.py`
(Lean, still `qou`-specific: it imports `qou_lib`). Neither has been removed:
`qou` still runs the second in CI, and retiring it is the owner's call.

Status fills come from the same stylesheet as the family colours
(`--fa-uml-status-*` in `uml.css`). A human review outranks an agentic one,
which outranks the Lean status: the order the CI graph used.

**Never populate `uses[]` from the formal graph to make a drawing look
connected.** The editorial relation is authored; see `AGENTS.md` and
[`uses-editorial-review`](../folio-core/uses-editorial-review.md). Rule 4 is how
the drawing keeps them apart.

## Related

- [`graph-detanglement`](graph-detanglement.md): restructuring the graph this
  skill draws.
- [`edge-kinds-and-blast-radius`](edge-kinds-and-blast-radius.md): why edge
  kinds must stay distinct (rule 4).
- [`uml-overview`](../folio-core/uml-overview.md): the schema diagrams, where
  these rules were first learned.
- [`kg-viewer`](../folio-core/kg-viewer.md): the shared rule for an HTML
  viewer that fetches its projection by a path relative to itself.
