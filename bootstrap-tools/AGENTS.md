# AGENTS.md — bootstrap-tools

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md). What this toolset *is* is [`README.md`](README.md). Three rules govern work here, and each guards a boundary that is easy to erase by accident.

## 1. Nothing you add here may make `bootstrap` need a tool

Bootstrap promises an agent that it needs nothing installed: *"a file you read, not something you run"*. So the direction is one-way: **bootstrap-tools reads and writes bootstrap; bootstrap never imports from here.** A change that would put an import, a dependency, a `package.json` or a build step into `bootstrap/` is the wrong change. The owner: *"bootstrap should not know zod at all."*

## 2. Nothing here may import above bootstrap

bootstrap-tools depends on bootstrap, on `zod`, on `liquidjs` (the README templates), on `@playwright/test` and `bpmn-js` (to draw a Process), and on the runtime, and on nothing else (owner, 2026-09-29). `bun run check:tools-closure` fails on any import that leaves this directory or names another package; tests may also use `bun:test` and `ajv`. When you need something from a harness, move the small piece down, or have the harness call this toolset instead.

## 3. A generated schema is a published contract

The JSON Schemas in `bootstrap/schemas/` are generated from `schemas/*.ts` and published at their `$id`. Changing the Zod changes what a third party accepts. Two known traps:

- **`.refine()` exports nothing to JSON Schema.** A rule written only as a refinement vanishes from the published document. Add its JSON Schema form too (`JSON_SCHEMA_CONDITIONALS`), and a test case that fails without it.
- **`z.object()` is strict.** The exporter would add `additionalProperties: false`; the generator strips it. Adopting strictness is a decision, not a side effect.

A published node's identifier must be its file's path under the release address; `bun run check:node-iris` fails otherwise.

After a change here: `bun run bootstrap:schemas`, then `bun test bootstrap-tools`. The `--check` twins are in the gate set.

## Running a tool as a process step

Each script is a step an agent can perform in a process lane: the agent runs it, reads its output, and reports. Nothing here requires a CI service; a GitHub Actions workflow may be described but is not enabled unless the owner asks (owner, 2026-09-29: *"assume primarily agentic"*, and no paid runs without an explicit request).

Which lane runs what — the lanes are the roles of [`kg-separation.bpmn`](../cat-harness/processes/kg-separation.bpmn) while the pair is staged, and of the content repository's own review once it is not:

| step | command (from this directory) | lane | fails when |
|---|---|---|---|
| regenerate schemas and the schema page | `bun run schemas` | authoring agent | — (writes) |
| schemas are current | `bun run schemas:check` | build pipeline | a generated file differs from its Zod |
| every file's identifier is its path | `bun run check:node-iris` | build pipeline | an `$id`/`@id` under the release base names another path |
| literal release IRIs at the declared version | `bun run iri:sync:check` | build pipeline | a literal names another version |
| no outside concept in the schemas | `bun run check:concepts` | build pipeline | a forbidden word appears |
| imports stay inside the toolset | `bun run check:closure` | build pipeline | an import leaves or names a package not allowed |
| READMEs and diagrams are current | `bun run readmes:check`, `bun run render:check` | build pipeline | a generated region or picture is stale |
| unit tests | `bun test .` | build pipeline | any fails |

A step that fails is reported with its output and the command to reproduce it; the agent does not "fix" a check by editing what the check reads unless that is the change under review.

## CI — described, not enabled

When the owner asks for CI, this is the whole of it: one workflow in the **content** repository, calling the tools at a pinned version. It is written here rather than committed as `.github/workflows/*.yml` so that nothing runs, and nothing is billed, until someone decides it should.

```yaml
# litlfred/bootstrap — .github/workflows/check.yml (NOT ENABLED)
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { path: bootstrap }
      - uses: actions/checkout@v4
        with: { repository: litlfred/bootstrap-tools, ref: v0.1.0, path: bootstrap-tools }
      - uses: oven-sh/setup-bun@v2
      - run: bun install --cwd bootstrap-tools
      - run: |
          cd bootstrap-tools
          bun run schemas:check && bun run check:node-iris && bun run iri:sync:check \
            && bun run check:concepts && bun run readmes:check && bun test .
```

The tools are checked out at a **tag**, never a branch: a content check that changes under the content without a commit to it cannot be reproduced. Rendering the diagrams needs a browser and is left to the agent's run, not this workflow, until someone asks.

No npm package is published either: `package.json` is `"private": true`. The parent consumes the tools by path while the pair is staged, and a published package is a decision for the first release (`kg-separation` stage 12).
