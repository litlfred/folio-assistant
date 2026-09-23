---
# folio-assistant-u2ol
title: 'TYPESCRIPT 7: the compiler API exists, and every path to it is namespaced `unstable/`'
status: todo
type: task
priority: normal
created_at: 2026-09-23T01:37:44Z
updated_at: 2026-09-23T01:37:44Z
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
