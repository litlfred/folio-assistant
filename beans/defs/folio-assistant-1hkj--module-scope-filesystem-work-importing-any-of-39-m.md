---
# folio-assistant-1hkj
title: 'MODULE-SCOPE FILESYSTEM WORK: importing any of 39 modules can throw, and the error names a symptom far from the cause'
status: todo
type: task
created_at: 2026-09-21T13:12:36Z
updated_at: 2026-09-21T13:12:36Z
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

## Done when

- [ ] Module scope does no filesystem resolution in these 39 modules
- [ ] A throw names the call site that needed the value, not a binding
      thousands of lines away
- [ ] A gate keeps the pattern from coming back, or the absence of one is
      argued

## Related, and NOT the same defect

`zkgs` — `findContentRepoRoot()` stops at `cat-harness/` so the repository's
own config is never read. Same function, different problem: that one is about
WHERE the walk stops, this one about WHEN it runs.
