---
# folio-assistant-u2ol
title: 'TYPESCRIPT 7: the compiler API exists, and every path to it is namespaced `unstable/`'
status: todo
type: task
priority: normal
created_at: 2026-09-23T01:37:44Z
updated_at: 2026-09-26T09:18:41Z
parent: folio-assistant-1xhc
---

## What

Dependabot #910 and #914 raise `typescript` 6 → 7. The owner ruled *"everything,
including the TS 7 rewrite"* (issue #956, 2026-09-22), with the stated escape:
*if TS 7 ships no supported compiler-API equivalent, pin to 6 and say so.*

**Neither branch of that ruling is what the measurement found.** An equivalent
exists, it works, and its own package path says `unstable`.

## Measured 2026-09-23 against `typescript@7.0.2`, installed in a scratch

**The main entry is gone.** `require("typescript")` exposes **two** exports —
`version` and `versionMajorMinor`. Every one of these reads `undefined`:

    createSourceFile   SyntaxKind   forEachChild
    ScriptTarget       createProgram   isInterfaceDeclaration

That is why the two consumers show 69 + 38 errors: `schema-graph.ts` and
`content/pipeline/qa-criterion-hash.ts` use **61 `ts.*` references** between
them.

**But TS 7 does ship an AST API — under `./unstable/`.** Loaded and confirmed
working:

| subpath | exports |
|---|---|
| `typescript/unstable/ast` | 409 |
| `typescript/unstable/ast/is` | 347 |
| `typescript/unstable/ast/scanner` | 25 |
| `typescript/unstable/sync` | 44, including `Program` and `Project` |

**Every type guard these two files use already exists there.** Checked one by
one — `isIdentifier`, `isPropertyAccessExpression`, `isStringLiteral`,
`isVariableStatement`, `isTypeAliasDeclaration`, `isPropertyAssignment`,
`isInterfaceDeclaration`, `isFunctionDeclaration`, `isEnumDeclaration`,
`isClassDeclaration` — **0 missing**.

## What is NOT there, and it is the part that decides the cost

**No standalone parse, and no read-only walk.** `createSourceFile`,
`parseSourceFile` and `forEachChild` are absent from `unstable/ast`,
`unstable/ast/is`, `unstable/ast/utils` and `unstable/ast/scanner` alike.
`unstable/ast/visitor` offers `visitNode`, `visitNodes`, `visitEachChild` —
a **transform** vocabulary, not the read-only descent both consumers do.

The replacement for "parse this one file and walk it" is
`unstable/sync`'s `Project` / `Program`: you construct a project and query it.

**So this is not a port. It is a re-architecture** of how both files acquire
their tree, and the type guards — the part that looks like the bulk — are the
part that needs no work at all.

## The decision, and why it is not an agent's

The rewrite is *possible*. The question is whether two scripts that run inside
`bun run gates` on **every push** should depend on an API whose own path says
`unstable`. Upstream reserves the right to change it in a patch release, and
these are not optional tools:

- `schema-graph.ts` builds the schema knowledge graph from TS declarations
- `qa-criterion-hash.ts` freshness-hashes QA criteria from source

A gate that breaks on somebody else's patch release is the `1xhc` failure
bought deliberately.

## NOT done here

No rewrite, no pin change. `typescript` stays at 6 and **#910 / #914 stay open
with this measurement as their stated reason**, rather than rotting unexplained
— which is what the ruling's escape clause asks for.

## Done when

- [x] TS 7's actual export surface measured, not inferred from release notes
- [x] Every type guard the two consumers need checked for existence — 0 missing
- [x] The absent primitives named, and the `Project`/`Program` replacement found
- [ ] The owner decides: rewrite against `unstable/`, or hold at 6 until the
      API is stable — **it is a risk call about gates, not a feasibility one**
- [ ] #910 and #914 carry a comment pointing at this bean


## A THIRD consumer, found 2026-09-26 — and the bean was right when written

Appended, not corrected: nothing above is wrong. The corpus moved under it.

`u2ol` says two consumers. There are three. `cat-harness/schemas/kind-validator.ts`
carries **8 `ts.` refs** and calls **`ts.createSourceFile` at line 318** — one of the
absent primitives this bean names.

It was not missed. This bean was written **2026-09-23T01:37Z**; that import arrived in
`e8917e7763d` (*rdkm: a graph kind names one node schema per `$schema` family*) at
**2026-09-23T06:39Z**, five hours later.

That cuts one way only: **the cost of the rewrite option grows while the decision sits
open.** A hold is not the static side of this choice.

### The gate exposure, stated narrowly because the wide version was not measured

- **Certain** — `readShape` (line 318) is called directly by `kind-validator.test.ts:194-205`,
  and `bun test` is **gate 1**. This file breaks under TS 7 inside the gate set.
- **Guarded, not shown live** — the only non-test caller is `resolveNodeSchemas` (line 360),
  reached only when a resolved ref carries a `shape`. `check:kind-validators:require-all`
  (gate 80) passes today and no declared ref carrying one was found; the corpus's `"shape"`
  hits are `docs/_data/stickies.json` board stickies. A dead path in today's corpus.

I nearly wrote "a third gate breaks". "Three gates break" and "one gate plus a guarded
path" are different claims and only the second is measured.

### Process note: this was re-derived, and it should not have been

A sibling posted the full measurement on #910 at **05:43Z today** — including two things
this bean lacked (`typescript-eslint` throws a hard `does not support TS 7.0` at module
load; `tsc` itself is 31.1s → 6.6s, so the hold has a price). I re-measured all of it from
scratch before reading that comment, because the bean's last unchecked box — *#910 and #914
carry a comment pointing at this bean* — had just been ticked and the bean did not know.

Same shape as `pesg`. The instrument had the finding; the queue could not see it. Cost here
was ~15 minutes and no wrong artefact, but it is the second time today.

### Still the owner's call

Unchanged: rewrite against `unstable/`, hold at 6, or run side-by-side. This adds one input
(option 1 is three files, not two) and no new option.
