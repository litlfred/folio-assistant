---
# folio-assistant-9cc0
title: 'ROOT TYPECHECK IS RED ON MAIN: tsconfig sweeps a separately-published sub-package whose vitest dep is not installed at the root'
status: todo
type: bug
priority: normal
created_at: 2026-09-26T11:06:36Z
updated_at: 2026-09-26T11:17:36Z
parent: folio-assistant-1xhc
---


## What is failing

`bunx tsc --noEmit` exits **2** on `main`:

    cat-harness/schemas/block-qa-schema/tests/parity.test.ts(26,40):
    error TS2307: Cannot find module 'vitest' or its corresponding type declarations.

**Measured on pristine `origin/main` at `a7b5f021498c786a90198196e18eb3d6c27a61ce`
in a clean detached worktree with `bun install --frozen-lockfile` — not on a
branch, not in a dirty container.** Arrived in `832cf524db` (bean `rsi6`, *"the
package's `test` script had never passed"*).

## Root cause, read rather than guessed

Three facts, each from the file that holds it:

| fact | source |
|---|---|
| the root includes `cat-harness/schemas/**/*.ts` | `tsconfig.json` `include` |
| `block-qa-schema` is a SEPARATELY PUBLISHED package that compiles itself | it has its own `cat-harness/schemas/block-qa-schema/tsconfig.json` |
| it declares `vitest: ^4` as its OWN dependency | `cat-harness/schemas/block-qa-schema/package.json:50` |

So the root typecheck reaches into a nested package that owns its own
compilation, and that package's dependencies are not installed into the root
`node_modules`. The glob was written before the nested package had tests.

**Note which gate does NOT see this.** `bun test` passes — 11826 pass — because
the file is a `vitest` suite that bun's runner does not pick up. Only `tsc`
sweeps it. A red typecheck and a green test suite over the same file is the
`1xhc` shape one level out: the runner that would judge the file is not the one
that reaches it.

## A tested patch, not a suggested one

One line in the root `tsconfig.json`:

```json
  "exclude": [
    "cat-harness/schemas/block-qa-schema",
    "dist",
    "node_modules"
  ]
```

**Verified by applying it to pristine `origin/main` in a clean worktree:
`bunx tsc --noEmit` exits 0.** That is the whole diff — 2 insertions, 1 deletion.

## Why this is the shape rather than the alternative

The other obvious fix is adding `vitest` to the ROOT `devDependencies`. That is
worse: it makes the root carry a dependency only one nested package uses, and it
does not address the reason the root is compiling that package's test files at
all. The sub-package's own `tsconfig.json` IS the declaration that it compiles
itself — excluding it makes the root honour that declaration.

**But it is a judgement about the compilation surface, not a defect with one
answer**, which is why this is a bean with a tested patch rather than a push. If
the intent is that the root type-checks every instance's schemas including
nested published packages, then the fix is installing the workspace properly and
the exclude is wrong.

## Why I did not fix it on #1361

It is unrelated to that branch's four features, no fix exists anywhere to port
(searched open PRs for `vitest`/`parity`: 0 results; no bean named it), and
widening a PR the owner has not yet ruled on splitting is the wrong direction.
Reported on #1361 with this patch.

## Done when

[ ] the owner decides which shape is correct: exclude the nested package from the
    root, or install the workspace so the root can compile it
[ ] `bunx tsc --noEmit` exits 0 on `main`
[ ] whichever way it goes, the reason the glob and the nested package disagree is
    written down where the next person adding a nested package will meet it
