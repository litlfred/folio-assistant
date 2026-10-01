# AGENTS.md — large-datasets

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). The rule here is about a question
this layer does **not** answer.

## This layer does not decide whether to take something

*"May we take this, and what does holding it cost"* is
[`materialize-remote`](skills/materialize-remote.md) — five gates, three
states, recorded as a `folio-materialization/v1` record. This layer answers the
question before it:

> How do you enumerate a corpus, and how do you ask it for a *part*?

So a change here that starts gating, budgeting or deciding is a change that
belongs in that skill, not in a descriptor. And it is not content: this is
about sources the instance will **never hold**, so it sits below the content
layer and **imports nothing from above `cat-harness`** — owner ruling
2026-10-01 makes it a subgraph of `cat-harness` (bean `rfuq`). A schema you
want from the content layer is restated here as the narrow projection you read
(`CatalogueNodeReadSchema` in `schemas/id-lookup.ts` is the worked case), never
imported.

## A descriptor is written down or it does not exist

Every source answers differently and **none of it is guessable**. Without a
declared descriptor, an agent asked for "the WPRO style guides" has to be told
the API by a human every single time, and that answer is recorded nowhere.

So when you learn how to enumerate a source, the deliverable is the
descriptor — not the data you fetched with it, and not a note in a session
that ends.

## Two worked descriptors, deliberately far apart

One example is a special case with an interface drawn round it. If you add a
third, pick one that breaks the shape rather than one that confirms it — a
descriptor format validated only against sources that resemble each other has
not been validated.

---

*A declared asset of this instance ([`large-datasets.json`](large-datasets.json), role
`agent-instructions`). Issue #592.*
