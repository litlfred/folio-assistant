---
# folio-assistant-1hkj
title: 'MODULE-SCOPE FILESYSTEM WORK: importing any of 39 modules can throw, and the error names a symptom far from the cause'
status: completed
type: task
priority: normal
created_at: 2026-09-21T13:12:36Z
updated_at: 2026-09-21T18:20:00Z
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

## RE-SCOPED ON STARTING: 39 was the wrong denominator, and the proposed fix was unsound

Two measurements taken before converting anything changed this bean.

**`findContentRepoRoot()` CANNOT THROW.** PR #695 made it catch `folioDir`
failures while searching and end in a declared fallback. So 33 of the 53 sites
carry no hazard at all — they cannot abort a module however malformed the
declarations are. What remains is **20 files** calling `folioDir(...)` at
module scope, which does throw.

**THE LAZY ACCESSOR THIS BEAN PROPOSED WOULD HAVE BROKEN A CONTRACT.**
`findContentRepoRoot` reads `process.cwd()`, and `checker-missing-evidence.test.ts`
depends on the value being fixed at module load — it says so in its own words,
and uses ABSOLUTE fixture paths *because* a test's `process.chdir` cannot move
it. Resolving lazily would let a chdir change the answer; memoising on first
use would be worse, making the value depend on which caller ran first. Six
tests and two production modules call `process.chdir`, so neither variant is a
refactor: both are behaviour changes.

## What was done instead — the value stays, only the THROW moves

`folioDirDeferred(root, import.meta.url)` resolves at load, under the cwd the
module was loaded with, exactly as before. It captures any failure and raises
it at FIRST USE, naming the module and carrying the original error as `cause`.

Twenty declaration sites converted, ~79 references, plus two downstream
consumers of the two `export const` cases. `adapters/document/paths.ts` keeps
its `get.FOLIO_DIR()` getter untouched — that one was already lazy.

**A codemod of mine hit an object KEY** (`FOLIO_DIR:` became `folioDirOf():`)
and broke that file. Reverted and redone with key positions excluded and the
one affected file held back for a hand pass, rather than patched over.

## Done when

- [x] Module scope does no filesystem resolution that can throw — zero
      module-scope `folioDir` calls remain, across 958 files
- [x] A throw names the module that could not resolve, and carries the
      declaration's own error as `cause`
- [x] A gate keeps the pattern from coming back — `check:module-scope-resolution`,
      in `code-quality-gates.yml`, falsified by planting the old pattern
      (exit 1 with it, 0 without)

5 tests on the helper, including the precondition that the fixture root really
does make `folioDir` throw — without it the other cases could pass over a root
that never fails. `bun run gates --all` **91 of 91**, 222 browser tests.

## Still true, and not taken

33 sites still call `findContentRepoRoot()` at module scope. That is fine
TODAY because the function cannot throw. It is worth knowing that the safety
rests on that property rather than on the call site, so a change making it
throw again would revive this whole class silently.

## Related, and NOT the same defect

`zkgs` — `findContentRepoRoot()` stops at `cat-harness/` so the repository's
own config is never read. Same function, different problem: that one is about
WHERE the walk stops, this one about WHEN it runs.

---

## Worked twice in parallel — and the gate has one gap

Session `017MEZnJxx7WeekiNCabx4hx` did this bean from the other end, unaware of
PR #719 until merging main. Its work is **reverted** rather than merged, in one
commit with its reasons, because two mechanisms for one hazard is the "two
answers free to disagree" defect this repository keeps paying for. Recorded
here because the disagreement is instructive and the agreement is corroboration.

**Agreed, independently:** `findContentRepoRoot` cannot throw, so most of the 53
sites carry no hazard and 39 was the wrong denominator. Two sessions reached
that by running the function rather than reading about it.

**Disagreed, and #719 is right.** The other session used a memo resolved on
**first use**. For the four sites shaped `folioDir(findContentRepoRoot())` that
moves the resolution itself to first use — and memo-on-first-use is worse than
either alternative, because the value then depends on *which caller ran first*.
This bean's own re-scoping says so, and
`checker-missing-evidence.test.ts` states the contract in its own words.

The failure mode is worth naming precisely, because it was not a missed fact:
that session **read** the test's comment, noticed it used absolute fixture
paths, concluded "immune either way", and proceeded — with a brief that had
already named this exact falsifier (*"if the memo changes which root a module
resolves … the transform is wrong and I revert that site rather than generalise
over it"*). Having the falsifier written down is not the same as applying it,
and a comment stating a contract reads exactly like a comment describing a
workaround.

### The gap that remains — two more resolvers throw

`folioDirDeferred` and the gate cover **`folioDir`**. Measured against a
directory holding `{ not json`, on main after this bean landed:

| function | result |
|---|---|
| `folioDir` | **THREW** |
| `directoryForGraph` | **THREW** |
| `directoriesForGraph` | **THREW** |
| `findContentRepoRoot` | returned its declared fallback |

Seven module-scope sites call the two graph resolvers, in
`source-ledger-index.ts`, `simulate-translation.ts`, `kg-viewer-strings.test.ts`,
`todos.ts`, `agent-memory.ts` and `adapters/mcp-server/paths.ts` (twice). They
carry the same hazard as the twenty this bean fixed, by the same mechanism, and
the gate does not see them — so a new one can be added without anything
noticing.

Follow-up, on top of #719's helper rather than beside it.
