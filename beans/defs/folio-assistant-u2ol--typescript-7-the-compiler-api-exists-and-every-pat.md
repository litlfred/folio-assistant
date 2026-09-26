---
# folio-assistant-u2ol
title: 'TYPESCRIPT 7: the compiler API exists, and every path to it is namespaced `unstable/`'
status: todo
type: task
priority: normal
created_at: 2026-09-23T01:37:44Z
updated_at: 2026-09-26T00:00:00Z
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
- [→] #910 carries a comment pointing here (2026-09-26). **#914 needs none — it
      MERGED on 2026-09-25**, which this bean's plan did not anticipate; see the
      update below

---

## UPDATED 2026-09-26 — #914 merged, and there is a SECOND blocker that is not about `unstable/`

Three things, and the first corrects this bean rather than adding to it.

### 1. `#914` is merged, so *"#910 / #914 stay open"* is no longer true

Merged 2026-09-25T18:06Z by the owner. It bumped
`cat-harness/schemas/block-qa-schema` from `5.9.3` to `7.0.2`, so **main already
carries TypeScript 7 in one package** while the root sits at `^6.0.3`.

Measured before calling it harmless:

| question | answer |
|---|---|
| is it a workspace member? | **no** — the root `package.json` has no `workspaces` key, so its devDependency is resolved independently |
| does it import the TS compiler API? | **no** — no `from "typescript"` anywhere under it |
| how does it use `tsc`? | as a build tool only: `tsup … --dts`, tests under `vitest` |
| does any gate run it? | `code-quality-gates.yml` never names it |

So the split is real but **inert**: it is not the shared-compile inconsistency it
looks like, and it does not touch the `unstable/` problem, which is about code
that `import`s the compiler. The correction that matters is to the *record* —
this bean's plan assumed both PRs would be held, and an agent reading it would
have gone looking for an open `#914`.

### 2. `typescript-eslint` REFUSES to load on TS 7.0 — a second, independent blocker

Not mentioned here, and it is not about `unstable/` at all.
`typescript-eslint@8.70.0` declares

    peerDependencies.typescript:  >=4.8.4 <6.1.0

and it does not warn-and-degrade. Run in an isolated probe — `typescript@7.0.2`
+ `typescript-eslint@8.70.0` + `eslint@9.39.5`, one file,
`recommendedTypeChecked`:

    typescript-eslint does not support TS 7.0.
    Please see …/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0
    to run typescript-eslint using the TS 6 API.
    See also typescript-eslint#10940 for tracking support for TS >=7.1

    Error: typescript-eslint does not support TS 7.0.   → eslint exit 2

A hard throw at module load, so `bun run lint` would not run at all. That is the
*better* failure mode — loud rather than silent — but it means the hold at 6 has
a **second** reason, and unlike the `unstable/` one this reason comes with a
**condition for revisiting**: upstream's own issue tracks TS ≥ 7.1. Two blockers
with different owners should not be carried as one.

Upstream also documents a side-by-side arrangement (typescript-eslint on the TS 6
API), which is a third option this bean's decision list does not offer and which
would let the compiler and the linter disagree about version on purpose.

### 3. What holding at 6 actually costs, since nothing here had priced it

`tsc -p tsconfig.json --noEmit`, both binaries run directly rather than through
`bunx`, same config, same tree:

| | exit | wall | diagnostics |
|---|---|---|---|
| `typescript@6.0.3` (current) | 0 | **31.1 s** | 0 |
| `typescript@7.0.2` (`#910`) | 0 | **6.6 s** | 0 |

**This does NOT contradict this bean's "69 + 38 errors", and the distinction is
the whole point.** Two different questions:

- *can TS 7 typecheck this codebase?* — yes, cleanly, ~4.7× faster. That is what
  `tsc --noEmit` answers.
- *is the compiler API those two scripts import still there?* — no. Re-verified
  independently today: `import("typescript")` under 7.0.2 exposes **2** exports,
  `version` and `versionMajorMinor`, and `createSourceFile`, `forEachChild`,
  `SyntaxKind`, `createProgram` and `ScriptTarget` all read `undefined`. Exactly
  what this bean measured on 2026-09-23.

So the hold is not costing correctness, it is costing ~25 s per typecheck — worth
stating, because a decision framed only as "risk of an unstable API" reads as
having no price on the other side. `schema-graph.ts` (65 `ts.` references) and
`qa-criterion-hash.ts` (37) remain the whole blast radius.

### Still the owner's, and still not an agent's

Unchanged, and now with three options rather than two:

1. rewrite both consumers against `unstable/sync`'s `Project`/`Program`
2. hold at 6 — now until **both** `unstable/` stabilises **and**
   typescript-eslint ships TS 7 support
3. side-by-side: TS 7 for `tsc`, the TS 6 API for typescript-eslint, per
   upstream's own note

No rewrite, no pin change, nothing installed into this repo — both probes ran in
a scratch directory and `git status` was verified clean afterwards.
