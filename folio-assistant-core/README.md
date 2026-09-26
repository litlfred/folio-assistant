# folio-assist-core

**The content layer.** What a *folio* is — the content-object model, the block
kinds, the adapters, and the `folio` graph kind itself.

It sits between `bootstrap/` (what an agent reads before anything is installed)
and the science layer, and it is composed **on top of** the agentic harness: it
may import from the harness, and the harness may never import from it. That
direction is checked — `bun run check:partition:edges` reports any edge running
the wrong way.

## Scope, stated so the boundary is checkable

| in scope | out of scope |
|---|---|
| the content-object model: what a block, a chapter, a document IS | the skills, schemas and MCP server that *operate* on it — those are the harness's |
| the `folio` graph kind, and its registration | any particular folio's chapters, constants or vocabularies — those live in the folio's own repository |
| content adapters (`document`, `paper`) and the profiles that nest inside them | the pipeline's transport and the tool surface |

The rule the whole repository turns on: **this is the platform, not the
content.** If you are about to write subject matter here, you are either in the
wrong repository or writing something that belongs in a folio as data.

## This instance is PRE-SPLIT

The modules this layer will own are currently interleaved with the harness's
under `cat-harness/`. `scripts/repo-partition.ts` is the machine-readable
statement of which module belongs where, and it reports the counts and every
wrong-direction edge on demand.

So this directory declares itself and contributes its card to the landing
board; it does not yet declare graph directories, because it does not yet hold
any. **Declaring a directory that is not there is worse than declaring none** —
every consumer then scans nothing and reports a clean run over it (bean `dh4f`).

Issue [#223](https://github.com/litlfred/folio-assistant/issues/223) tracks the
split.

## What is here today

| node | question it answers |
|---|---|
| [`schemas/dublin-core.ts`](schemas/dublin-core.ts) | what does the source system *say* about this item? |
| [`schemas/catalogue.ts`](schemas/catalogue.ts) | what collection does it sit in, and how big is that collection? |
| [`schemas/materialization.ts`](schemas/materialization.ts) | are the bytes here, and who decided they were allowed to be? |

They are one chain, read in that order. The third is the load-bearing one:
**materialising remote content is a process this repository already runs twice
and has never named** — `who-iris` taking three items out of 361.55 GB, and
`bootstrap` fetching a harness and landing it locally. `upstream-pins.json` is
half of that second one's refresh.

Outside that chain, and answering a different question:

| node | question it answers |
|---|---|
| [`schemas/changeset.ts`](schemas/changeset.ts) | what changed in a folio between two refs, **block by block**: added, removed, renamed, reworded or moved? Keyed on the block label, which the `id-unique` / `id-stable` QA criteria guard. Read by the review page (epic `q4jm`). |
| [`schemas/review-comment.ts`](schemas/review-comment.ts) | a reviewer's comment on one block, as a **todo kind** (`folio-review-comment/v1`, parent: the harness todo). It is required to name its block, has a closed lifecycle that only review-process tasks may move, is ingested idempotently from tagged PR comments, and follows renames. A removed block's comments are kept as orphaned (bean `423d`). |

## Three states, and there is no default

`referenced` (we know it exists and where; we hold no bytes) · `materialized`
(the bytes are here) · `unknown` (we have not established which).

A node that does not declare its state is **invalid**, not `unknown` — "the
author did not say" and "the author said they could not tell" are different
facts, and only the second is something somebody can act on.

## Why this is not in `cat-harness/`

The owner, 2026-09-20: *"not in cat-harness, in folio-assitant-core/ as a named
subgraph."* `BASE_GRAPH_KINDS` already carries the rule — *"skills/ schemas
beans all in cat-harness, voices, uploads library in folio-asst-core"* — and a
Dublin Core record is on the same side of that line as the library entry it
describes. The harness layer must not own a vocabulary for content it cannot
render, which is the argument `schemas/folio-graph-kind.ts` makes for `folio`
itself.
