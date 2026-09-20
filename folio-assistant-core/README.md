# folio-assist-core

The **content layer**, staged as a top-level directory ahead of the repository
split ([#223](https://github.com/litlfred/folio-assistant/issues/223)).

`cat-harness` is the harness: skills, workflows, roles, tools, the schemas the
harness itself needs. **Core is what a folio holds** — `library/`, `uploads/`,
`voices/`, and the vocabulary describing where that content came from and how
much of it is actually present.

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
