# AGENTS.md — bootstrap-tools

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md). What this toolset *is* is [`README.md`](README.md). Three rules govern work here, and each guards a boundary that is easy to erase by accident.

## 1. Nothing you add here may make `bootstrap` need a tool

Bootstrap promises an agent that it needs nothing installed: *"a file you read, not something you run"*. So the direction is one-way: **bootstrap-tools reads and writes bootstrap; bootstrap never imports from here.** A change that would put an import, a dependency, a `package.json` or a build step into `bootstrap/` is the wrong change. The owner: *"bootstrap should not know zod at all."*

## 2. Nothing here may import above bootstrap

bootstrap-tools depends on bootstrap, on `zod`, and on the runtime, and on nothing else (owner, 2026-09-29). `bun run check:tools-closure` fails on any import that leaves this directory or names another package; tests may also use `bun:test` and `ajv`. When you need something from a harness, move the small piece down, or have the harness call this toolset instead.

## 3. A generated schema is a published contract

The JSON Schemas in `bootstrap/schemas/` are generated from `schemas/*.ts` and published at their `$id`. Changing the Zod changes what a third party accepts. Two known traps:

- **`.refine()` exports nothing to JSON Schema.** A rule written only as a refinement vanishes from the published document. Add its JSON Schema form too (`JSON_SCHEMA_CONDITIONALS`), and a test case that fails without it.
- **`z.object()` is strict.** The exporter would add `additionalProperties: false`; the generator strips it. Adopting strictness is a decision, not a side effect.

A published node's identifier must be its file's path under the release address; `bun run check:node-iris` fails otherwise.

After a change here: `bun run bootstrap:schemas`, then `bun test bootstrap-tools`. The `--check` twins are in the gate set.

## Running a tool as a process step

Each script is a step an agent can perform in a process lane: the agent runs it, reads its output, and reports. Nothing here requires a CI service; a GitHub Actions workflow may be described but is not enabled unless the owner asks.
