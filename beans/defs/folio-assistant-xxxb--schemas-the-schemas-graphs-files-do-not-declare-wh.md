---
# folio-assistant-xxxb
title: 'SCHEMAS: the schemas/ graph''s files do not declare what they are'
status: todo
type: task
created_at: 2026-09-18T19:04:01Z
updated_at: 2026-09-18T19:04:01Z
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
