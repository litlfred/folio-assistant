---
# folio-assistant-1j3q
title: 'ROUTE-KEYED STORAGE: a third `keyedBy` for regenerable rendered pages — one entry per route, replaced by its one writer, never spliced with `expect`'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-03T13:20:54Z
updated_at: 2026-10-03T13:21:20Z
parent: folio-assistant-fs43
---

Owner, 2026-10-03, decision 3 of the auto-doc rendered-graphs Q&A (#1966):
**"Add route-keyed storage, then move it off main"** — asked about the cost of
leaving generated pages committed on `main`.

The schema's own docblock (`cat-harness.ts`, §"`keyedBy` — two keyings, and a
third is a schema change") says what this bean is: *"The field is an enum, not
a string, so a third keying is a schema change somebody has to make rather than
a reinterpretation of an existing value."* This is that change.

## Why `route` is not a synonym for `tip`

`tip` exists for **non-regenerable** state — a bean is somebody's decision, so
its write splices with `expect` and two sessions editing one file is a
`conflict` the caller must settle (`branch-store.ts` §"The write path").

A generated page is a **pure function of its source**. For it, `conflict` is
the wrong answer: there is nothing to settle, because no one authored either
side. The newer generation wins, and the unit that is replaced is the ROUTE.
So route-keying is the same branch mechanism with two deliberate differences:

| | `tip` | `route` |
|---|---|---|
| unit | the whole mirrored tree | one site route |
| write | splice **with `expect`** | replace, **no `expect`** |
| two writers on one path | `conflict`, nothing pushed | last generation wins |
| a lost write costs | lost work | a rerun |
| layer (`holds`) | `state` | `derived` |

The falsifier, stated before building: **if a generated page has more than one
writer, "one declared writer per route" fails and `route` collapses into
`tip`.** `gen-docs-auto.ts` owns each of its 11 types' output exclusively, which
is why the first family is one of them.

## What it is for, measured

- PR #1966, 2026-10-03: a single conflict against `main`, and it was
  `cat-harness/docs/cat-harness/docs-auto/index/index.html` — a generated page,
  conflicting as a BINARY file (`warning: Cannot merge binary files`).
- Bean `8c6v`, same day: of the 17 `cat-harness/docs/*.md` pages whose own
  front matter says `do not hand-edit`, **17** classify as
  `refuse / — none —`, and **0** are named in `.gitattributes`.

## Done when
- [ ] `keyedBy: z.enum(["commit", "tip", "route"])`, with the docblock's third bullet and the `qa` refinement widened to refuse `route` too
- [ ] `branch-store.ts` reads a `route`-keyed branch: the manifest check compares against the DECLARED keying rather than the literal `tip`
- [ ] a `route` write carries no `expect`, and removing that turns a named test red (mutation-checked, the house rule for this file)
- [ ] no declaration is flipped in this bean — `main` stays authoritative
- [ ] first family (`docs/uml/`, one generator, one gate `uml:overview:check`) is a FOLLOW-ON bean, not this one

## Deliberately not here
- `gh-pages` and `lake-cache`, which are `fs43`'s own last Done-when.
- The 49 of 94 gated checks that write page files. A-narrow by choice: one
  family proves the mechanism, and a 49-check flip cannot be bisected.
