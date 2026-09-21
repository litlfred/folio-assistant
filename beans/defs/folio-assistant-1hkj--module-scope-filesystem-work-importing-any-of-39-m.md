---
# folio-assistant-1hkj
title: 'MODULE-SCOPE FILESYSTEM WORK: importing any of 39 modules can throw, and the error names a symptom far from the cause'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T13:12:36Z
updated_at: 2026-09-21T17:40:00Z
parent: folio-assistant-vke6
---

Carved out of 95s1 (issue #706, PR #707), where it was found and deliberately not taken.

## The shape, measured on main 2026-09-21

Thirty-nine modules resolve the repository root at MODULE SCOPE:

    const REPO_ROOT = findContentRepoRoot();
    const FOLIO_DIR = folioDir(REPO_ROOT);

**39 files, 53 call sites** — 25 in `content/pipeline/`, 11 in `scripts/`, 3 in `adapters/`.

## Why it matters, with the worked case

Both functions throw on a declaration that will not parse. A throw at module
scope ABORTS EVALUATION, so every export below the failing line is left
unbound — and `await import()` can then hand back the half-built namespace
rather than re-throwing.

That is exactly what 95s1 chased for an afternoon under the wrong name.
`qa-checkers-extended.ts` threw at line 49; `EXTENDED_AUTOMATED_CHECKERS` at
line 3235 was never bound; the error read *"Cannot access
'EXTENDED_AUTOMATED_CHECKERS' before initialization"* — **naming a symptom
3,186 lines from its cause**, and looking so much like a circular import that
the bean was opened as one.

## A COUNT CORRECTION, kept because it is the point

95s1's PR body, its issue comment and its bean all say **12** modules. That
number came from a `head`-limited grep over two directories and was quoted as
a count. The real figure is 39 files / 53 call sites, and the understatement
made the follow-up look three times smaller than it is. `kg-audit`'s rule —
never quote a count from prose, count the thing — applied to my own prose.

## What a fix looks like

A lazy accessor: `repoRoot()` memoised on first call, so the throw happens
where the value is USED and names the caller. Mechanical per site, but 53 of
them, and every one is a module that currently cannot fail to import.

(The original "Done when" is restated and answered at the end — two copies of
the acceptance criteria are two places for them to disagree. Note that its
first line said "no filesystem resolution", which is broader than the defect
turned out to be: `findContentRepoRoot` does filesystem work and cannot throw.)

## Related, and NOT the same defect

`zkgs` — `findContentRepoRoot()` stops at `cat-harness/` so the repository's
own config is never read. Same function, different problem: that one is about
WHERE the walk stops, this one about WHEN it runs.

---

## Worked 2026-09-21 — and the premise needed correcting in both directions

The counts were re-derived rather than quoted, and they match exactly: **53
call sites in 39 files**. Nothing to correct there.

What did need correcting is **which functions carry the defect**. This bean
says *"Both functions throw on a declaration that will not parse"*. Measured,
by running them against a directory holding `{ not json`:

| function | result |
|---|---|
| `folioDir` | **THREW** |
| `directoryForGraph` | **THREW** |
| `directoriesForGraph` | **THREW** |
| `findContentRepoRoot` | returned its declared fallback |

`findContentRepoRoot` was made **total** in #695 — the same change that made a
corrupt declaration reachable here in the first place — because it is a SEARCH
and every `folioDir` probe inside it is wrapped, ending in a declared fallback.
So a module-scope call to it cannot produce this failure. And two functions
that DO produce it were not in this bean's list at all.

That moves the boundary twice, and both ways:

- **Twenty-eight of the fifty-three sites are `findContentRepoRoot()`** and are
  not this defect. Converting them would have tripled the diff while removing
  no crash — and would have moved every root resolution from import time to
  first use, a **cwd-timing change** with nothing driving it, since
  `findContentRepoRoot` walks up from `process.cwd()`. Several tests `chdir`
  between import and use, so that is a real behaviour change and not a
  theoretical one.
- The remaining sites, plus the graph-directory resolvers this bean did not
  name, are the actual hazard.

### What landed

**Twenty-nine sites in twenty-six files** are now lazy accessors:

```ts
let _folio_dirMemo: string | undefined;
const FOLIO_DIR = (): string => (_folio_dirMemo ??= folioDir(REPO_ROOT));
```

so the throw happens where the value is USED and names the caller. The root
each one resolves against is unchanged — these take an already-computed root
as an argument — so there is no cwd-timing change for them.

Applied by a codemod that **declines rather than guesses**, and its first three
versions were all wrong in ways worth recording, because each was a clean-
looking answer produced by not looking:

1. It refused any `{ … NAME … }`, which caught `{ cwd: REPO_ROOT }` — a
   property VALUE, perfectly safe — and declined 14 files for nothing. The
   unsafe shape is object *shorthand*; the distinction is the colon.
2. The tightened guard then caught `${NAME}` — a template hole, where
   `${NAME()}` is exactly right — and declined 5 more.
3. Its declaration regex could not see `folioDir(findContentRepoRoot())`,
   because `\([^)]*\)` stops at the inner paren. Two files were missing, and
   the way that was found is the only reliable way: the codemod's file list was
   diffed against an independent grep, and the two sets had to agree before a
   single file was written.

It also rewrote names inside **comments** — `see the note on FOLIO_DIR` became
`FOLIO_DIR()`. Prose is not code; reverted in three files.

### The gate

`bun run check:module-scope-resolution`, registered in
`code-quality-gates.yml` so `gates.ts` picks it up. It refuses an eager
module-scope declaration whose right-hand side calls a throwing resolver, and
it **recognises the fixed form** — the first version flagged all twenty-nine
sites it had just been written to certify, because a lazy accessor still
contains the call. What separates them is the arrow.

Falsified both ways: a planted eager site is reported with its file and line; a
`TRACKED` entry whose file no longer matches is reported as **stale and to be
deleted**, because an allow-list that keeps an entry after the reason for it is
gone stops being a list of known exceptions and becomes a blind spot.

### Tracked, not done — the exported constants

Three files keep module-scope resolution because their constants are
**exported**, so making them lazy is a change at every import site:

| file | why |
|---|---|
| `adapters/mcp-server/paths.ts` | `FOLIO_DIR`, `UPLOADS_DIR`, `TODOS_DIR`; 5+ importers |
| `adapters/document/paths.ts` | one static `FOLIO_DIR`, beside an existing lazy `get` |
| `scripts/todos.ts` | exported `TODO_ROOT` |

`document/paths.ts` is the smallest and is a **migration to finish rather than
to design**: it already carries `export const get = { FOLIO_DIR: () => … }` and
labels the statics beside it *"backward compatibility with tool files. For
dynamic resolution, tools should import `get` above."* Only `FOLIO_DIR` among
its statics calls a throwing function; the rest are `resolve(...)`.

`bun run gates`: 88 of 88.

## Done when

- [x] Module scope does no throwing declaration resolution — **in every file
      but the three tracked ones**, each named with its reason
- [x] A throw names the call site that needed the value, not a binding
      thousands of lines away
- [x] A gate keeps the pattern from coming back — `check:module-scope-resolution`,
      falsified in both directions
- [ ] The three exported modules migrate to accessors (tranches 2 and 3)
