---
# folio-assistant-jcmx
title: 'ContentAdapter: parameterise so the harness names no content type'
status: completed
type: task
priority: normal
created_at: 2026-09-20T06:59:19Z
updated_at: 2026-09-20T07:07:30Z
parent: folio-assistant-vke6
---


## The inherited note was wrong about WHY, and reading the file said so

`repo-partition.ts` carried this, deferring the edge:

| `ContentAdapter`, the half the harness calls into, is defined ENTIRELY in
| content terms: every method returns `FolioItem`, `ContentOutline`,
| `ChapterDetail`, `ResolvedSection` or `ResolvedDocument`. Splitting it out
| does not remove the edge, it moves it.

True of a SPLIT, and it is why the fix was not a split. But it is not why
the edge existed. Every one of those shapes is **declared in
`src/types.ts`**, not imported. The file had exactly one core import:

```ts
import type { FeedbackItem, PaperMacro } from "../schemas/types.js";
```

`PaperMacro` used once, `FeedbackItem` in seven places. The intractable-
sounding problem was two symbols.

## Generics were the first design and a measurement killed them

The plan was `ContentAdapter<Todo, Macro>` with bounded defaults. Before
threading a type parameter through five interfaces and six files, the
question worth asking was whether any consumer would ever instantiate it
differently — so: what reads a field off `.todos` or `.macros` through these
shapes?

**Nothing does, anywhere in the repository.** They are CARRIED, not
inspected. A type parameter no one varies is ceremony with a migration cost.

So each is declared as the structural minimum a harness signature needs —
`TodoRef` (id, summary, status) and `MacroDef` (tex, unicode?) — and
TypeScript's structural typing does the rest. `FeedbackItem` satisfies
`TodoRef`; `PaperMacro` satisfies `MacroDef`. No `unknown`, no `any`, and no
field any caller loses.

This is the typed form of the pattern `src/types.ts` already stated for
`getFeedbackStore?()`: *declare the slot, name the type where it is owned.*

## A content-profile leak fixed on the way

`ResolvedDocument.macros` is on the GENERIC document shape, and a `document`
folio has no macros — `PaperMacro` is the paper adapter's vocabulary.
Typing the generic slot with a paper-specific name said the platform knew
about papers. Independent of the partition, and worth fixing regardless.

## One measurement I got wrong, and the correction

I reported in PR #469 that classifying `src/types.ts` as core "was tried and
measured, and the edge is unchanged". The experiment was INCONCLUSIVE: the
harness `exact` list is consulted first, so the core entry never applied. I
noticed at the time, said so, and then reported the conclusion as measured
anyway.

Measured properly here: `src/types.ts` is consumed by `server.ts`,
`core/rbac.ts` and `routes/chat.ts` (harness) AND by `blocks/`,
`adapters/document/` and `routes/feedback.ts` (core). Moving it to core
mints **3 new** harness->core edges. The conclusion stands; the evidence I
gave for it was not the evidence I had.

## A claim that was one too low

"The `FeedbackItem` re-export has no consumers" — `adapters/document/index.ts`
re-exports it onward inside an `export {}` block my grep pattern missed.
`tsc` caught it. That adapter is core, so it now imports the schema
directly: core -> core, no edge, and it works with the full type rather than
the harness's minimum.

## Both axes of the gate are now enforced

`4j3h` enforced unassigned when that count reached zero and left edges
reported at 1, with a note to delete the distinction when they followed.
They have. Per the repo's precedent -- a check is an error only once its
count is zero -- wrong-direction edges are now fatal too, with a message
that names each edge and says to check the TARGET's layer before the
importer's, which is the mistake this session made twice.

Watched failing before being trusted: re-introducing the `#468`
misclassification gives 3 named edges and exit 1.

## Measured

| axis | before | after |
|---|---:|---:|
| unassigned modules | 0 | 0 |
| wrong-direction edges | 1 | **0** |
| edges declined | 0 | 0 |

43 gates, 3180 tests / 0 fail, tsc clean, eslint clean.
