---
$schema: folio-fsh-guts/v1
title: "generate-docs.ts"
kind: script
movedOn: 2026-09-20
movedFrom: "cat-harness/scripts/generate-docs.ts"
issue: 223
bean: folio-assistant-3w0i
summary: >-
  A 908-line documentation generator that has been in this repository since its ROOT COMMIT and has never run once — never in a package.json script, never in a workflow, its output directory never committed, in any commit in the history. Retired at the owner's word. It was also the sole citation making three declared fields look consumed; with it gone, SkillDefinition.schemas, SkillCapabilityRef.degradation and fallbackRole have provably zero readers.
---

# `generate-docs.ts`

**Never run.** Not "stopped being run" — *never*, in the whole history of the
repository. Retired at the owner's word, 2026-09-20, after the audit in
[`zod-schemas-as-tools.md`](../proposals/zod-schemas-as-tools.md) found it was
the only code referencing three declared fields.

Moved here rather than deleted, per
[`fsh-guts`](../../cat-harness/skills/folio-core/fsh-guts.md) — delete means
relocate, and actual deletion needs the owner's explicit word. The body is
beside this record, not only in history, because it is the one thing that says
what the ACTORS and CAPABILITIES references would have contained.

1. TOC
{:toc}

## The archaeology

Measured 2026-09-20 on `0301fbd2`, by commit rather than by reading.

| | |
|---|---|
| **created** | `04092f37`, 2026-09-15 23:10:58 +0000 — **the repository's root commit** (no parents; `git rev-list --count` = 1) |
| that commit | 1,169 files, 266,728 insertions, under the subject *"docs: diagrams are figures, so they are white in both schemes; stamp the build"* |
| ever in `package.json` | **never** — `git log --all -S"generate-docs" -- package.json` is empty |
| ever in a workflow | **never** — the same search over `.github/` is empty |
| output `schemas/generated/` ever committed | **never** — `--diff-filter=A` over that path is empty |
| size | 843 lines at creation → **908 now** |
| commits touching it since | **8**, and *not one of them was about this script* |

**It was not decided on; it was swept in.** The root commit is a bulk import
of an existing tree, and its subject is about diagram colours. Nothing in the
history records anyone choosing to add a documentation generator, which is
consistent with nobody ever choosing to run one.

## The 65 lines of maintenance nobody meant to spend

Every commit that touched it was a sweep passing through:

| commit | what it was actually doing |
|---|---|
| `ff6906ab` | extracting the Lean lexer to core |
| `25b4c623` | splitting the actor kind three ways |
| `4a7d9ab9` | `wlqd` — the remote-package declaration |
| `320ff5c4` | draining schemas and KG-root literals, 37 → 29 |
| `c25761d2` | moving the instance under `cat-harness/` |
| `78c8babf` | draining the two-roots class |

That is the cost this retirement removes, and it is the argument for moving
the file out of `tsconfig.json`'s `include` rather than leaving it in place:
it was being kept compiling, renamed, and re-pathed by people fixing other
things, none of whom had reason to ask whether it ran.

## An ignore for a directory that has never existed

`eslint.config.mjs` carried `"schemas/generated/**"` — an ignore for this
script's output. Added in **the same root commit**. So the ignore and the
generator arrived together and neither ever did anything; the ignore is
removed with the retirement, because its referent can now never exist.

## What it would have produced, and why that is not nothing

Seven pages plus a catalogue: `SCHEMAS.md`, `SKILLS.md`, `ACTORS.md`,
`CAPABILITIES.md`, `REQUIREMENTS.md`, `PACKAGES.md`, `LIFECYCLE.md`,
`index.json`.

The live generators — `gen-schema-docs.ts` (23 pages) and `gen-skill-docs.ts`
(175 pages) — cover the first two subjects and **not** the rest. Measured
across `cat-harness/docs/reference/skills/`: *capabilities* appears in **0**
pages, *packages* in 1, *lifecycle* in 2. So this was **not duplication**: it
is the only thing that would ever have documented capabilities and actors as
a reference.

That is the honest cost of retiring it, and it is why the decision was the
owner's rather than mine. Nobody has missed the reference, because it has
never existed.

## It would have rendered `[object Object]`

```ts
if (d.schemas?.length) {
  L.push(`**Associated Schemas:** ${d.schemas.join(", ")}  `);
}
```

`SkillDefinition.schemas` is `SkillSchemaRef[]` — `{ module, types, access }`
objects. `Array.join` calls `toString` on each. Had it ever run, that line
would have emitted `[object Object], [object Object]`, which is itself
evidence it never did: nobody read the output.

## What this settles about three other fields

It was the **only** code referencing them. With it retired, each has
demonstrably zero readers:

| field | declared by | read by |
|---|---|---|
| `SkillDefinition.schemas` | 11 of 22 skill modules | nothing |
| `SkillCapabilityRef.degradation` | 23 values across 24 modules | nothing |
| `SkillCapabilityRef.fallbackRole` | 1 (`qa-report-signing`) | nothing, at runtime — `check:fallback-roles` resolves it statically |

Several earlier records say *"the only reader is `generate-docs.ts`, which
**renders** it"* — beans `85e8`, `wlqd`, `nup0`, and PRs #450 and #452. That
was too generous and is corrected in `folio-assistant-3lbz`: a field with one
renderer sounds maintained, a field with none is inert. Those beans are left
as written, being the record of what was believed when.

**Whether the three fields survive losing their last citation is a separate
question**, not decided here. `fallbackRole` has a static checker and a BPMN
gateway that agrees with it; the other two have neither.

## Recovering it

It is beside this file. In history: `git show 04092f37:scripts/generate-docs.ts`
for the original, or `git log --all --follow -- cat-harness/scripts/generate-docs.ts`
for every version.
