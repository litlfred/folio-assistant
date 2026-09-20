---
# folio-assistant-i31r
title: 'TOOLS: one parameterised validate Tool, keyed on graph kind (3lbz route A)'
status: completed
type: feature
priority: normal
created_at: 2026-09-20T05:41:29Z
updated_at: 2026-09-20T05:59:18Z
parent: folio-assistant-zzmr
---


**Route A of `folio-assistant-3lbz`**, authorised by the owner 2026-09-20
("1 2"), who also asked what the business purpose is.

## Business purpose, as established before building

`tools/` is a declared graph with **inherited** scope; `.github/workflows/`
is declared nowhere. So a downstream instance inherits the platform's Tool
nodes and **none of its 42 gates**. Today folio-assistant validates its own
graph in CI and a folio built on it validates nothing — and #363's
self-sovereign topology ("no github, local git only") has no CI to inherit
from at all. Secondary: #215's author changing an immunization schedule
needs "is this valid?" answerable without knowing which of 42 scripts to run.

## The falsifier fired, and the design changed because of it

The plan was to add a schema reference to `GraphKindRegistry`. **It already
had one** — `GraphKindDef.schema`, declared by 3 of 16 kinds, read by
nothing, and silently instance-relative rather than repo-relative since #437.

Then the real falsifier: `qa` declares `content/pipeline/qa-witness.ts`,
which exports **TypeScript interfaces only**. No Zod schema for
`qa-witness/v1` exists anywhere. So `schema` means *where the shape is
written down*, not *what can be run*, and overloading it would have made its
one substantial use a lie.

`GraphKindDef.validator` (`module#Export`) is therefore a SECOND field, and
the justification is a committed case where the two diverge — not a
preference.

## Shipped

| | |
|---|---|
| `GraphKindDef.validator` | `module#Export`, the spelling `folio:decision` already uses |
| declared for | `health`, `translation-sources` — the two kinds with a real Zod schema |
| `schemas/kind-validator.ts` | resolver returning a three-state union, so a caller cannot read a verdict without handling "undeclared" |
| `scripts/kg-validate.ts` | the Tool: give it a path, it resolves the kind from the declaration and runs that kind's validator |
| `tools/index.ts` | `kg-validate`, the FIRST Tool node bound to `kg-navigation` |
| `check:kind-validators` | declared-but-unresolvable fails; undeclared is reported. Derived sweep 41 -> 42 |

Verified end to end: validates a real `repository.health-report.json`, and
returns "could not determine" with a reason on a `qa` node rather than a tick.

## Done when

- [x] a validator is resolvable from a graph kind
- [x] one parameterised Tool, not one per schema
- [x] `kg-navigation` has a Tool
- [x] undeclared is a reported third state, never a pass
- [x] the wrong premise in the proposal is corrected in place
- [ ] route B — bind the 42 gates as Tool nodes (owner said "1 2"; B was the
      second half of route 1 and is not started)

## Not doing

Declaring `validator` for the other 14 kinds. That is 14 judgements about
what validates what, several of which have no single answer — `cat-harness`
says so in its own doc comment — and `qa`'s answer is that no Zod schema
exists to name. Writing schemas for them is its own work, not this bean's.
