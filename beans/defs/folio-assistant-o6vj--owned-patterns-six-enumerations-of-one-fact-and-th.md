---
# folio-assistant-o6vj
title: 'OWNED PATTERNS: six enumerations of one fact, and the prune sweep did not cover a page the generator writes'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-22T09:27:56Z
updated_at: 2026-09-22T09:28:13Z
parent: folio-assistant-1xhc
---


Issue #895. Found during #886/#888 (bean `ha78`) and deliberately not fixed
there — moving a viewer and reworking a generator's ownership model are
different changes.

## The defect

`gen-iris-pages.ts` prunes its own orphans against two regexes.
`catalogue.html` was written to `docs/` and named in NEITHER, so the sweep that
exists to reclaim stale output could never have reclaimed it.

That sweep is not decorative. Re-keying two items on 2026-09-20 left **nine
files where seven were wanted**, two serving records the catalogue no longer
described, and `--check` was blind because it only inspected what it was about
to write. A page outside the ownership patterns is a page outside that
guarantee.

## Why nothing caught it, which is narrower than "a missing name"

`OWNED` — the union — DID contain `catalogue`, so the existing test *"OWNED
matches what the generator emits"* passed. The property no check asserts is
the per-side one:

> every page written to a side is owned by THAT SIDE'S pattern

That assertion would have failed the day the page was added.

## Six enumerations, two already broken

| | where | state |
|---|---|---|
| `DOC_PAGES` (exported) | `gen-iris-pages.ts:210` | **no consumer anywhere** |
| `DOC_PAGES` (local) | `tests/gen-iris-pages.test.ts:40` | same name, **different membership** |
| `OWNED` | `:213` | **stale** — still names `catalogue`, gone since #888 |
| `OWNED_LIB` | `:216` | live |
| `OWNED_DOCS` | `:227` | live — the one with the hole |
| `wanted` | test `:136` | stale **twice in three days** |

## What the regex must keep doing

It is NOT "everything in the directory" and must not become that. It defines
the generator's NAMESPACE, deliberately broader than its current output, so a
stale `item-*.html` is prunable while a hand-authored page, an asset directory
or a `.nojekyll` survives — `deletion-requires-confirmation` applied to a
generator's own sweep. Deriving ownership wholesale from the write set would
delete that property.

So: **fixed pages** from one declaration (where `catalogue` fell through),
**wildcard families** left explicit (where the pruning power lives).

## Done when

- [ ] one source of truth; the derived forms carry no independent names
- [ ] a page written to a side its pattern does not own FAILS, demonstrated by
      injection rather than asserted
- [ ] `OWNED` no longer names `catalogue`
- [ ] `bun run gates` green
