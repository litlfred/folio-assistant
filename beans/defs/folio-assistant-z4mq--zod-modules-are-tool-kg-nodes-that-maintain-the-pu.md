---
# folio-assistant-z4mq
title: Zod modules are tool KG nodes that maintain the public JSON-LD / JSON Schema
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T22:22:06Z
updated_at: 2026-09-19T05:22:33Z
parent: folio-assistant-zzmr
---


## The requirement, in the author's words (2026-09-18)

> make sure schema skills and tools as separated well. the zod(.ts) should be
> tool KG nodes that implement maintaining a json-ld/json schema for public
> authoritative. it is the CODING convention of cat-harness that the zod/.ts
> toolchain is used to maintain INTERNAL the json schema. it is a REQUIREMENT
> that any instance of cat-harness is able to render its json-ld.

It restates, for the code, the split the author gave on 2026-09-18:

> external = The JSON-LD is definitional.
> internal = (maintenance of code/schemas) zod/typescript is definitional and
> json-ld is downstream.

## What follows from it

1. **Three graph kinds, cleanly separated.** `schemas`, `kg` (skills, roles,
   workflows) and `tools` are distinct. `schemas/` currently declares
   `graphs: ["schemas", "kg"]` and its files do **not** declare what they are —
   `@module` names the path, four files carry none, and three `.test.ts` files
   sit in the declared directory without being schema nodes. That is bean
   `xxxb`, and it is the same defect this bean has to fix one level up.

2. **A zod module is a TOOL node, not only a schema node.** Its job — the thing
   it *does* — is maintain the authoritative JSON Schema / JSON-LD. Today that
   relation is nowhere declared: `bun run kg:schema`
   (`scripts/harness-schema-export.ts`) and `bun run kg:export`
   (`scripts/kg-export.ts`) know which zod module feeds which artefact, and the
   knowledge lives in those scripts rather than in the graph.

3. **Rendering JSON-LD is a conformance requirement of every instance**, not a
   convenience of this one. Needs a check that an arbitrary cat-harness
   instance — including one whose `cat-harness.json` declares directories this
   repo does not have — can render its JSON-LD, and a "could not determine"
   third state that is never reported as a pass.

## Done when

- A zod module declares itself a tool node and names the artefact it maintains,
  so `kg:export` reads the relation from the graph instead of carrying it.
- `schemas/`, `skills/` and `tools/` each hold one declared kind, or the
  multi-kind ones carry in-file declarations (the `$schema` convention the
  workflow instances already use).
- A check fails when an instance cannot render its JSON-LD, and reports
  "could not determine" separately from "rendered".

## Not in scope here

The `tools/<stub>` / `skills/<stub>` per-instance layout convention
(separate ask, same session) and the marker-naming decision (`79t3`).

## Done already (2026-09-18, `claude/festive-galileo-s7ibx0`)

Author's follow-up: *"json-ld render should include metadata (timestamp,
commit sha)."* — done in `73d2c9e4`. `scripts/kg-export.ts` now emits
`sourceCommit` (`prov:wasDerivedFrom`, the commit's web URL),
`sourceCommitSha`, `sourceCommitAt`, `sourceTreeDirty` and
`sourceCommitUnavailable`, all declared in `@context` so they survive
expansion to RDF. Four states kept distinct: clean, dirty (SHA rides with the
flag), no-git (reason, never a placeholder), and status-unanswerable
(`sourceTreeDirty` absent rather than `false`).

Provenance deliberately does NOT go in `problems`, whose contract is "sources
that could not be read" — a dirty checkout is the normal state of a
developer's machine, and routing it there would make `problems: []` fail on
every local run.

**What remains for this bean is unchanged**: the zod modules declaring
themselves TOOL nodes that maintain the JSON-LD, and rendering JSON-LD being a
checked conformance requirement of an arbitrary instance rather than a thing
this repo happens to do.

## Item 3 shipped — `check:instance-render`, 2026-09-20

`scripts/check-instance-render.ts` + `scripts/tests/instance-render.test.ts`,
wired into `code-quality-gates.yml` and so into `bun run gates` (42 now, no
second edit — `n60j` deriving the list rather than restating it).

**"Did it throw" is not the check, and that is the whole design.** An export of
nothing SUCCEEDS. Both defects this was written against rendered cleanly:
`collectSkills` resolved bootstrap's declared directory against the wrong root
and dropped every one of its skills in silence, and `bootstrap.jsonld`
publishes 16 graph kinds while its declaration names one. Neither threw. So the
check compares what an instance DECLARES against what it PUBLISHES.

**My own emptiness guard was unreachable, and its test is what proved it.** The
first version failed an instance on `nodes.length === 0`. An instance declaring
NOTHING renders 16 nodes — `collectGraphKinds()` is classified `universal`,
takes no root, and emits the whole registry into everything. So the condition
could never fire: a guard against a clean run over an empty set, itself
reporting a clean run over an empty set. The verdict now counts the instance's
OWN nodes (total minus the registry's) and reports both. Measured after the
fix: cat-harness 1288 own of 1304, bootstrap 33 of 49, an empty fixture 0 of 16
— which fails, as it must.

**Declared means TRANSITIVELY declared.** `beans/beans.json` declares
`bean-defs` and `workflow-state`, `todos/todos.json` declares `todo-items` and
`todo-feedback`. Reading `harness.json` alone gives cat-harness five undeclared
kinds where the true figure is ONE; four of the five are that mistake. The
check follows nested graph files, reads both the `graphs` and `kinds`
spellings, and an unparseable nested file contributes nothing rather than
manufacturing a finding — that file's problem belongs to `check:harness-dirs`,
which reports it loudly.

**THREE STATES.** `rendered` · `undetermined` (no declaration, or one that will
not parse — exit 2, never a pass, and it carries NO published kinds because it
never looked) · `failed` (threw, or rendered nothing of its own — exit 1).

**The undeclared-kind finding is REPORTED, not fatal, and that is deliberate.**
Count today: cat-harness 1 (`folio`, contributed by core), bootstrap 15 — 16
together, because every instance gets the whole registry. This repository's own
rule, stated in `code-quality-gates.yml` for ruff: *a check is an error only
once its count is zero*. Making it fatal now would mean either a red gate
nobody can clear or this module quietly settling an ownership question that
belongs to this bean. **Promote it the moment `collectGraphKinds` is
instance-scoped and the count reaches zero**; a test pins the non-fatality so
that promotion fails loudly if the count has not been cleared first.

### Still open, unchanged by this

`COLLECTOR_SCOPE` files `graphKinds` as `universal` — "reads nothing
instance-specific at all". A graph kind is contributed by a LAYER, so the
registry is global in STORAGE and not in OWNERSHIP. And the code already
disagrees with itself: `collectGraphKinds`' comment says *"`voices` and
`library` are core's"* while `graphKindNamespace()` resolves all 16 registered
kinds to the cat-harness namespace. Either the namespaces or the comment is
wrong and nothing checks which. **This check now measures the gap (16) rather
than closing it**, which is what makes closing it verifiable.

## Done when — item 3

- [x] A check fails when an instance cannot render its JSON-LD.
- [x] "Could not determine" is reported separately from "rendered", and exits
      distinctly (2 vs 1 vs 0).
- [x] It works on an arbitrary instance, including one whose declaration names
      directories this repo does not have (temp-instance fixtures).

## Swept by `fkjo` 2026-09-21 and found to be a FALSE POSITIVE

Left open, and the detector was wrong rather than this bean.

`fkjo`'s sweep counted `[x]`-style checkboxes and found all three ticked. They
are not this bean's criteria: they sit under `## Done when — item 3`, a
**sub-checklist of one item**. The bean's actual Done-when is a `•` bullet
list above it, and it is unticked.

Recorded on `fkjo` as a limitation the check it proposes must handle: a
sub-checklist under one Done-when item is not the bean's Done-when, and a
detector that cannot tell them apart will report finished beans that are not.

