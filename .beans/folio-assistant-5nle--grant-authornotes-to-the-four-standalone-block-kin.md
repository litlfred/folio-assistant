---
# folio-assistant-5nle
title: Grant authorNotes to the four standalone block kinds — prose, equation, diagram and table silently drop it
status: completed
type: task
priority: normal
created_at: 2026-08-24T17:10:33Z
updated_at: 2026-08-24T17:14:14Z
---


## What was wrong

`prose`, `equation`, `diagram` and `table` do not extend `BlockBase` — they
are standalone interfaces with deliberately small field sets — and
`authorNotes` was missing from all four, in **both** `schemas/types.ts` and
`schemas/constraints.ts`.

The Zod objects are neither `.strict()` nor `.passthrough()`, so the default
applies: **an unknown key is stripped, silently, and the parse succeeds.** A
block declaring `authorNotes` therefore had it dropped before anything
downstream saw it. The note was neither rendered, nor validated, nor reported,
and nothing told the author.

Five real notes are being discarded that way in qou today, found by #5115 and
deliberately left there because deleting the key destroys authored prose and
granting the field is a schema decision:

| block | kind |
|---|---|
| `fine-structure-data` | prose |
| `tm-interaction-completeness` | prose |
| `millennium-bounds-via-surreals-intro` | prose |
| `hecke-log-decomposition-table-data` | table |
| `q-beta-form-a-n1-symbolic-table-data` | table |

## Why the existing parity test could not catch it

`schema-ts-zod-parity.test.ts` compares the TS interfaces against the Zod
schemas per kind, and it caught exactly this family before (`uses`, `title`,
`tags`). It was silent here because **the field was absent from both sides**:
the two implementations agreed, and agreed on being wrong. A test that only
compares two implementations of one idea is blind to what neither implements.

## Fix

`authorNotes?: AuthorNote[]` on the four interfaces, and
`authorNotes: z.array(AuthorNoteSchema).optional()` on the four schemas. Same
shape as the earlier `uses`/`tags` pass recorded on `EquationBlock.uses`.

There is no reason a standalone kind cannot carry one: an author note is
editorial metadata **about** a block, not content within it, and the render
default is SKIP for every kind either way.

## Tests, and proof they bite

Three new groups in `schema-ts-zod-parity.test.ts`: `authorNotes` declared on
every kind in TS, the same in Zod, and — the one that matters — that a note
**round-trips through `safeParse`**. Declaration is what a reader can check by
eye; survival is the property that was actually broken.

Verified by removing the grant from `ProseSchema` and re-running: **4 tests
fail**, including the round-trip. Restored: 24 pass.

The last of the four is worth its own line. `granting the field did not weaken
validation` asserts an `authorNotes: [{kind: "nonsense"}]` is REJECTED — and
without the grant it *passes*, because the whole key is stripped before the
`kind` enum is ever consulted. The silent strip did not merely lose good data;
it made invalid data look valid.

```
bun test    704 pass, 33 skip, 0 fail   (697 before — 7 new)
eslint .    exit 0
gen-schema-docs + gen-skill-docs   no diff
tsc --noEmit                       exit 0
```
