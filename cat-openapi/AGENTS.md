# AGENTS.md — cat-openapi

The **OpenAPI harness**. It holds OpenAPI 3 documents as nodes of graph typology
`openapi`, and gives every **operation** in them a page and an IRI.

## The one rule

**The document is the API authors'; the pages are ours, and they copy nothing.**
A document is ingested verbatim beside a `<id>.source.json` naming the
repository, path and commit it came from. Every page is a thin page
(`cat-harness/scripts/thin-page.ts`): identity and a pointer. The operation's
parameters, request body and responses are drawn in the browser by one shared
loader from the served document (`visualizer-loading`). A fix to what an
operation says is a fix upstream, then a re-ingest.

## What an instance declares

1. A directory of graph typology `openapi`, `served: true`, in its `<instance>.json`.
2. `cat-openapi.config.json` at its own root, naming that directory and each
   document's source (`schemas/openapi.ts`, `OpenApiConfigSchema`).
3. `cat-openapi` in its `needs`.

Then `ingest-openapi.ts --instance <dir> --source <checkout>` brings the bytes
in, and `gen-openapi-pages.ts --instance <dir>` writes the pages and JSON-LD
into the same graph. Both take `--check`.

## Where the pages and IRIs land — inside the `openapi` graph

| what | path under the graph's directory | |
|---|---|---|
| the document | `<doc>.openapi.json` + `<doc>.source.json` (the ingest's), node `<doc>.jsonld`, page `<doc>/` | lists every operation |
| an operation | `<doc>/<operation>.jsonld`, `.json`, page `<doc>/<operation>/` | its `@id` is that `.jsonld` address |

In the graph and not in `docs/`: an operation is a node OF the openapi graph,
and an IG instance's `docs/` belongs to `gen-ig-pages.ts`, which reports
anything else there as an orphan. The graph is `served`, so it publishes
verbatim at `/<instance>/<path>/` — a thin page needs no Jekyll.

`<operation>` is the document's `operationId`, or `<method>-<path>` when it
gives none (`operationsOf`). Two operations that would share an id are refused,
never suffixed — a suffix would be an IRI nobody chose.

## Which way the dependencies run

```
bootstrap → bootstrap-tools → cat-harness → cat-openapi → (instances that hold OpenAPI documents)
```

This layer may import `cat-harness`, and nothing above it. The graph typology sits
in the harness's registry beside `fhir-artifact-index`, with a `nodeSchemas`
pointer back here, because every checker that reads an instance declaration
must know the kind and the harness cannot import this layer.

Design note and decisions: PR #1976. Bean `s4ta`.
