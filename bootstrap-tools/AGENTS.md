# AGENTS.md — bootstrap-tools

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). Two rules govern work here, and
both are about a boundary that is easy to erase by accident.

## Nothing you add here may make `bootstrap` need a tool

That instance's README promises an Initiator **no harness, no server, no tools
and no work plan**, and that what it reads is *"a file you read, not something
you run"*. This instance exists so that promise can stay true while its shapes
are still first-class.

So the direction of travel is one-way: **`bootstrap-tools` reads and
writes `bootstrap`; `bootstrap` never imports from here.** If a change
would put an import, a dependency, a `package.json` or a build step into
`bootstrap/`, it is the wrong change — the owner's words are *"bootstrap
should not know zod at all"*.

## The generated documents sit at a published `$id`, so what VALIDATES is a contract

`bootstrap/skills/discussion.*.schema.json` is generated from
[`schemas/discussion.ts`](schemas/discussion.ts) by
`bun run bootstrap-tools:schemas`, and those `$id`s are already published —
cited from `discussion.bpmn`, `cat-harness/tools/index.ts`, the generated
skill docs and `.pot` catalogues in five languages.

**Changing the Zod changes what a third party accepts.** Two ways that has
already bitten, both caught rather than shipped:

- **`.refine()` exports nothing.** Measured: `zodToJsonSchema` emits no
  `allOf`, no `if`/`then`, no message. The output document's two conditionals
  live in `JSON_SCHEMA_CONDITIONALS` as well as in the refinements, and
  `schemas/discussion.test.ts` asserts the two forms agree on a corpus. If you
  add a refinement, **add its JSON Schema form too, and a case that fails
  without it.**
- **`z.object()` is strict.** The exporter adds `additionalProperties: false`
  everywhere; the generator strips it, because the documents this replaced
  carried none and publishing it would reject what validates today. Whether to
  adopt strictness deliberately is bean `z634` — not a thing to flip in
  passing.

After any change here: `bun run bootstrap-tools:schemas`, then
`bun test bootstrap-tools/schemas/discussion.test.ts`. The `--check` twin
is in the gate set, so a forgotten regeneration is a red rather than a
surprise for whoever next follows the `$id`.
