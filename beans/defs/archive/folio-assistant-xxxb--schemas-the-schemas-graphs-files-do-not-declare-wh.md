---
# folio-assistant-xxxb
title: 'SCHEMAS: the schemas/ graph''s files do not declare what they are'
status: completed
type: task
priority: normal
created_at: 2026-09-18T19:04:01Z
updated_at: 2026-09-19T05:46:54Z
---

## The question that found it

The author, reviewing the unified directory schema: *"schemas are also .ts
node types?"*

Measured on this branch, 2026-09-18:

```
ls schemas/*.ts                 30
ls schemas/*.test.ts             3
grep -l '@module' schemas/*.ts  23
```

## The answer is no, and it is the odd one out

The declaration principle is that a directory says what to EXPECT and **the
files declare what they are**. Three of the four graph kinds hold that up:

| graph | declares itself by |
|---|---|
| `kg` (`skills/*.md`) | YAML front matter — `name`, `roles`, `description` |
| `bean-defs` (`beans/defs/*.md`) | front matter — id, `title`, `status`, `type` |
| `workflow-state` (`*.json`) | `"$schema": "folio-workflow-instance/v1"` |
| **`schemas` (`schemas/*.ts`)** | **nothing that says what it is** |

Two distinct problems:

**1. `@module` is not a type declaration.** It names the file's own path,
which a scanner already knows. It says WHERE, not WHAT. And four real schema
files carry none at all: `bib-verification.ts`, `lean-packages.ts`,
`precision-scalar.ts`, `webpage.ts`.

**2. Three `.test.ts` files live in the declared directory and are NOT schema
nodes.** `agent-harness.test.ts`, `contributions.test.ts`,
`harness-config.test.ts`. A consumer scanning `schemas/` and treating every
`.ts` as a schema node would be wrong about three of thirty, and the only
thing telling them apart is the filename — which is exactly the
"distinguishable by extension … a coincidence of the current layout, not a
contract" defect #263 named and the bean graph was restructured to avoid.

## Why this is a bean and not a quick fix

It is a convention decision across 30 files, and the right convention is not
obvious. At least three options, none yet argued:

- a JSDoc tag (`@graphNode schema`) — cheap, greppable, invisible at runtime
- an exported const — runtime-readable, but noise in every module
- exclude by pattern (`*.test.ts`) in the declaration — solves only problem 2,
  and by restating a layout coincidence rather than replacing it

Whoever takes it should also decide whether `kg` needs the same treatment:
skill front matter declares `name` and `roles` but never says "I am a skill",
so it is self-describing without being self-CLASSIFYING. That may be fine.

## Not established

Whether any consumer actually scans `schemas/` and would be misled today.
Nobody has checked; the defect is currently latent.

_2026-09-19T05:40:29Z_ — Measured and resolved 2026-09-19, as z4mq item 2. THE BEAN'S PREMISE WAS NOT LIVE, and its own 'Not established' section said so: 'Whether any consumer actually scans schemas/ and would be misled today. Nobody has checked.' Checked. Nothing scans schemas/ as a graph: repo-partition scans the directory but classifies .test.ts by an explicit FIRST rule (by what it IS, not what it exercises), and SCHEMAS_DIR in scripts/tests/helpers.ts has ZERO consumers. So the three .test.ts files mislead nobody today. THE REAL DEFECT IS ONE LEVEL UP. Measured on 814b693e: cat-harness.json declares schemas/ with graphs ['schemas','kg'] and the exported graph contained ZERO nodes of the schemas kind — 11 node types, none a schema. A declaration a consumer reads and finds nothing behind is the dh4f shape, reaching the instance's own root declaration. Five of seven declared directories project nothing (beans, library, schemas, uploads, voices); only kg via skills/ and tools produce nodes. The owner chose 'project them, then the convention matters'. CONVENTION CHOSEN: the JSDoc tag, from the bean's three options. Not the exported const (noise in every module, and it must cost nothing at runtime); not pattern-exclusion of *.test.ts (solves only problem 2, and by restating a layout coincidence — the 'distinguishable by extension … a coincidence of the current layout, not a contract' defect #263 named). A tag is greppable from OUTSIDE the toolchain, which matters because a consumer reading the repository rather than importing it has to be able to answer the question. EVERY file declares, including the ones that are not nodes: '@graphNode none — <reason>', reason REQUIRED, so silencing costs more than declaring. 37 schema nodes; 3 exempt (index.ts a re-export barrel, builders.ts constructor functions over other modules' schemas, namespaces.ts one IRI constant); 10 test files undeclared and reported SEPARATELY rather than pattern-excluded, because a test declaring nothing is the expected shape with a different remedy. 0 undeclared non-test. Stale figure corrected: the bean says four files carry no @module (bib-verification, lean-packages, precision-scalar, webpage); lean-packages has one now, so it is three. SHIPPED: scripts/schema-nodes.ts reads the declarations; collectSchemas in kg-export projects 37 Schema nodes carrying name, title (first prose line), module, and maintainedBy — the INVERSE of Tool.maintains from #323, written out rather than left for a consumer to derive; both new terms declared in @context (maintainedBy a link, module a literal) so a JSON-LD processor does not drop them; undeclaredSchemaModules is its OWN reported field, NOT problems, whose contract is 'sources that could not be read' — an undeclared module is not an unreadable one, and widening that field would make problems:[] meaningless; bun run check:schema-nodes is the gate, verified by adding an untagged module and a reasonless 'none' and reading both messages. The bean's open question — whether kg needs the same treatment, since skill front matter is self-describing without being self-CLASSIFYING — is NOT answered here and stays open.
