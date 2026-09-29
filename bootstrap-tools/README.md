# bootstrap-tools

**The toolchain that renders and validates `bootstrap`, kept outside it so
bootstrap does not have one.** Staged here, to become
[`litlfred/bootstrap-tools`](https://github.com/litlfred/bootstrap-tools).

Owner, 2026-09-29 (bean `81tw`):

> we will https://github.com/litlfred/bootstrap-tools use this for the tools
> that render bootstrap/ but were put in cat-harness. for now create dir
> bootstrap-tools/ for staging split out into repo. make sure IRIs updated

That **reverses `319n`** (2026-09-24, "Validate/zod in cat-harness") for the
files below. `etg1` staged this instance first (2026-09-20) and `319n` retired
it.

## What lives here

| | |
|---|---|
| `schemas/discussion.ts` | the two documents the `discussion` process carries |
| `schemas/bootstrap-graph.ts` | the graph document bootstrap owes instead of a visualiser |
| `scripts/gen-bootstrap-schemas.ts` | writes `bootstrap/schemas/*.schema.json` and their drawn page — `bootstrap:schemas` |
| `scripts/bootstrap-schema-page.ts` | the drawn page's renderer |
| `scripts/validate-bootstrap.ts` | parses bootstrap's documents against their Zod — `bootstrap:validate` |
| `scripts/schema-semver.ts` | the bump a schema change requires — `bootstrap:semver` |
| `scripts/gen-bootstrap-graph.ts` | builds bootstrap's graph locally — `bootstrap:graph` |
| `scripts/check-bootstrap-concepts.ts` | a bootstrap schema names no outside concept — `check:bootstrap-concepts` |
| `skills/bootstrap-contract-semver.md` | what MAJOR, MINOR and PATCH mean for bootstrap's published contract |

## What did not move, and why

`cat-harness/schemas/graph.ts`, `requirement.ts` and `model-registry.ts` are
also generated into bootstrap, and they **stay in cat-harness**: cat-harness
imports them, and this instance needs cat-harness, so moving them would make a
cycle. The generator reads them across the boundary in the permitted direction.

## The render pipeline

`bootstrap:schemas` → `bootstrap:validate` → `bootstrap:semver` → publish. The
first two run in one CI step; the third is read before a merge, and a MAJOR
bump needs the owner because the published `$id` does not change with it.

Why bootstrap's shapes cannot be Zod *in bootstrap*:
[`bootstrap/README.md`](../bootstrap/README.md) promises a Bootstrapping Agent no
harness, no server and no tools — a file you read, not something you run.
