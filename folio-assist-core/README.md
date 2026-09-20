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
