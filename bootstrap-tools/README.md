# bootstrap-tools

**The toolset that describes [`bootstrap`](../bootstrap/README.md), kept outside it so bootstrap does not have one.**

Bootstrap is a content Knowledge Graph: files to read (`.md`, `.json`, `.bpmn`) and nothing to run. Its README promises an agent that it needs nothing installed. So the code that writes bootstrap's schemas and checks its content lives here, beside it, and bootstrap never imports from here.

It is **one** toolset over swappable content. Someone who wants a different generator, visualiser or checker uses a different toolset against the same bootstrap.

## What is here

| path | what it is |
|---|---|
| `schemas/graph.ts` | bootstrap's defined terms, in order, with what each uses and the schema that defines it; its graph kinds; the declaration shape |
| `schemas/discussion.ts`, `requirement.ts`, `model-registry.ts`, `glossary-ledger.ts` | the Zod source of the other schemas bootstrap publishes |
| `schemas/declaration.ts` | reads a Knowledge Graph declaration with bootstrap's own shape |
| `schemas/release-iri.ts` | an instance's release addresses: `<iriBase><version>/` for programs, `<iriBase>v<major>/` for people |
| `schemas/declared-order.ts` | checks that an authored order keeps its promise: each item uses only items above it |
| `scripts/gen-bootstrap-schemas.ts` | writes `bootstrap/schemas/*.schema.json` and the drawn page `bootstrap/schemas/README.md` |
| `scripts/iri-sync.ts` | keeps every literal release IRI at the declared version |
| `scripts/term-links.ts` | links each defined term in README prose to its definition |
| `scripts/subgraph-readmes.ts`, `scripts/templates/readme/` | writes each declared directory's README from its declaration, through Liquid templates; standalone it writes only the graphs these tools `support` |
| `scripts/readme-graph-sections.ts` | the `kg:processes` and `kg:files` README sections: every Process drawn, every file described from itself |
| `scripts/git-files.ts` | the files git accounts for — tracked, plus untracked and not ignored |
| `scripts/check-closure.ts` | fails if anything here imports beyond itself, `zod`, `liquidjs` and the runtime |
| `scripts/check-node-iris.ts` | fails if a published node's identifier is not its file's path |
| `scripts/check-bootstrap-concepts.ts` | checks bootstrap's requirement concepts |

## Running it

Every tool is a script an agent runs, as the actor in a process step, or a person runs by hand. None needs a service.

```sh
bun run --cwd bootstrap-tools schemas          # regenerate bootstrap's schemas and schema page
bun run --cwd bootstrap-tools readmes          # regenerate bootstrap's directory READMEs
bun run --cwd bootstrap-tools schemas:check    # fail if they are stale
bun run --cwd bootstrap-tools check:closure    # nothing here imports above bootstrap
bun run --cwd bootstrap-tools check:node-iris  # every published identifier is its file's path
bun run --cwd bootstrap-tools test
```

In this repository the same commands are also root scripts (`bootstrap:schemas`, `check:tools-closure`, `check:node-iris`, `iri:sync`) and run in the gate set.

## Status

Staged here as a sibling directory until `litlfred/bootstrap-tools` gets its first commit. The package is `private` until its first release; removing that is part of the release step. Bean `xsqm`.
