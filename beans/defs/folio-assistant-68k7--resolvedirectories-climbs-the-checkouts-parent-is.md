---
# folio-assistant-68k7
title: 'resolveDirectories climbs the checkout''s PARENT: is that intended for the ROOT instance?'
status: completed
type: task
priority: normal
created_at: 2026-09-30T19:48:10Z
updated_at: 2026-10-09T13:36:00Z
parent: folio-assistant-1xhc
---

**Owner ruling, 2026-09-30: leave open until the call site is named.**

## Why this is its own bean

It was Box 3 of `8zsb`, and **`8zsb` is `completed`**. A completed bean's
unchecked box is not reachable by `beans list`, so the question was on its way
to being invisible — which is `8zsb`'s own lesson (*a finding needs somewhere
to live that nobody has to already know about*) turned on the bean that taught
it. Two sessions have now declined to guess at this, and declining is only
useful if the next one can find the question.

`8zsb` itself is finished and stays that way: its two fixes landed in #1668,
measured on `main` `61810002758` in a checkout named `wrong-name-probe` —
22 pass, 0 fail, `/tmp/folio-dir-*` delta 0.

## The question

`resolveDirectories` walks the checkout's **parent** looking for sibling
instances. For the ROOT instance — whose instance root IS the repository —
that lands **outside the checkout**. A checkout placed directly in `/tmp`
therefore treats every sibling directory in `/tmp` as a candidate instance,
which is how 163 deliberately-malformed test fixtures took down two unrelated
tests.

The leak is fixed (#1668). This is the separate question the leak exposed, and
it would still be a question with `/tmp` spotless.

## What the code says about itself

The docblocks lean toward **not intended for the root instance**:

- `siblingScopeFor` — `repoRootFor` *"climbs out of the checkout"* for the root
  instance, and this helper exists **so sibling lookup does not**
- `resolveCoveragePath` — the same, *"going up one lands outside the checkout
  entirely"*

But two callers still compose `repoRootFor` **unconditionally**:

- `rootForScope` (`scope: "repository"` → `repoRootFor`)
- `declaredKindsEntryRoot`

So the intent is written down twice and not enforced in either of those.

## NOT established — and this is the blocker

**Which call produced the failing stack.** Observed:

```
readVoicesGraph → directoriesForGraph → resolveDirectories → readDeclaration
```

Neither of the two unconditional callers above has been shown to be the one on
that path. Until that is measured, a fix is a change to every declared
`scope: "repository"` resolution with no evidence about which one is wrong —
larger than it looks, and aimed by guess.

## Done when

- [x] the call on the `readVoicesGraph` stack that climbs to the parent is
      NAMED, with the measurement that identifies it: `resolveDirectories` line 4801
      calls `rootForScope(link.root, dir.scope)`, which previously called `repoRootFor`
      unconditionally on repository-scoped entries.
- [x] only then: whether the climb is intended for the root instance is
      answered: NOT intended. `g43f` fixed it: `rootForScope` calls `checkoutRootFor(instanceRoot)`
      instead of `repoRootFor(instanceRoot)` so `scope: "repository"` paths on the root
      instance stay within the checkout.
- [x] whichever way it goes, a case that would have caught this is added:
      pinned in `cat-harness-tools/schemas/instance-roots-worktrees.test.ts`:
      `rootForScope: a scope: "repository" path on the root instance resolves inside it`

## Closed 2026-10-09

- **Root Cause Identified**: In `resolveDirectories` (`cat-harness/schemas/cat-harness.ts:4801`), directory path resolution computed `absPath: resolve(rootForScope(link.root, dir.scope), dir.path)`. `rootForScope` previously called `repoRootFor(instanceRoot)`, which climbs out to `dirname(instanceRoot)` when the instance root is already at the repository root.
- **Resolution**: Under bean `g43f`, `rootForScope` was updated to use `checkoutRootFor(instanceRoot)`:
  ```ts
  export function rootForScope(instanceRoot: string, scope?: DeclarationScope): string {
    return scope === "repository" ? checkoutRootFor(instanceRoot) : instanceRoot;
  }
  ```
  `declaredKindsEntryRoot` similarly resolves through `rootForScope`, ensuring that repository-scoped paths on root instances never escape to the checkout parent directory.
- **Verification**:
  - `bun test ./cat-harness-tools/schemas/instance-roots-worktrees.test.ts` passed (18 pass, 0 fail).
  - Explicit test: `rootForScope: a \`scope: "repository"\` path on the root instance resolves inside it` verifies that for both root worktree instances and nested instances, repository scope resolves to the checkout root, not the parent.

