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
- [x] `keyedBy: z.enum(["commit", "tip", "route"])`, with the docblock's third bullet and the `qa` refinement widened to refuse `route` too
- [x] `branch-store.ts` reads a `route`-keyed branch: the manifest check compares against the DECLARED keying rather than the literal `tip` — and in BOTH directions
- [x] a `route` write carries no `expect` — REFUSED rather than ignored — and removing that turns a named test red (mutation-checked, below)
- [x] no declaration is flipped in this bean — `main` stays authoritative
- [x] first family (`docs/uml/`, one generator, one gate `uml:overview:check`) is a FOLLOW-ON bean, not this one

## Deliberately not here
- `gh-pages` and `lake-cache`, which are `fs43`'s own last Done-when.
- The 49 of 94 gated checks that write page files. A-narrow by choice: one
  family proves the mechanism, and a 49-check flip cannot be bisected.

## Built 2026-10-03 — `claude/route-keyed-storage`, PR #1996

| part | where |
|---|---|
| the enum and its docblock bullet | `schemas/cat-harness.ts`, §"`keyedBy` — three keyings, and a fourth is a schema change" |
| the `qa` refusal, widened to both non-commit keyings | same file, the `ContentDirectoryShape` refinement |
| the keying passed to the store, manifest compared against it | `scripts/branch-store.ts`, `BranchStoreOptions.keyedBy`, `verifiedTip()` |
| `expect` refused on a route write | same file, `write()` |
| the discipline | `skills/kg/kg-core/content-context-and-state-graphs.md` §"Where a graph is STORED" |

**Mutation-checked, which is this file's own practice rather than an extra.**
Two mutations, each run on its own:

| mutation | what went red |
|---|---|
| drop the route `expect` refusal | `route keying > a route-keyed write REFUSES \`expect\`, naming the paths` |
| pin the manifest check back to the literal `"tip"` | `route keying > the manifest must agree with the keying the caller opened for, BOTH ways` **and** the pre-existing `reading > corrupt: a branch with no manifest, a foreign one, or a commit-keyed one…` |

19 pass on real git (`branch-store.test.ts`, up from 14), 20 on the schema
(`directory-storage.test.ts`). The schema test for the keyings is now
`test.each(["tip", "route"])` rather than one case, for the reason in the code
comment: a guard that names a single keying admits every keying added after it.

### One thing chosen rather than derived, recorded as debt

A route-keyed branch's root manifest still says `$schema:
"state-manifest/v1"`, and "state" is the wrong word for a `derived` graph. It
is reused anyway, for three reasons in this order: the two seeded branches
(`cat/cat-harness/beans`, `cat/cat-harness/todos`) already carry that string, so
a second value would turn them `corrupt`; the format is identical in every
field; and `keyedBy` INSIDE the manifest is already the discriminator, which is
this repository's "the file declares what it is" rule. A second `$schema` for an
identical format would be two names free to drift. The name is historical, and
this paragraph is the record rather than a silent reuse.
