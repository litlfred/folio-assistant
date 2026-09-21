---
# folio-assistant-ankg
title: Subgraph viewer generators write but never prune — an orphan page answers to no declaration
status: completed
type: bug
priority: normal
created_at: 2026-09-20T21:02:36Z
updated_at: 2026-09-21T05:25:36Z
parent: folio-assistant-vke6
---

Found live during #603's merge of main, not hypothesised.

## What happened

#604 renamed `folio-assist-sci/` to `folio-assistant-sci/`. Subject slugs in
the schema and library viewers are derived from the entry's PATH, so
regeneration correctly produced the new page:

    /cat-harness/library/folio-assistant-sci/

It did NOT remove the page it replaced. `folio-assist-sci/index.html` survived
as a page serving a subject the declaration no longer describes, at a URL
nothing links to. Removed by hand in #603; the generators are unchanged.

## Why --check did not catch it

`schema:viz:check` and `library:viz:check` only ever inspect the files they are
ABOUT TO WRITE. A file the generator no longer writes is outside what they look
at, so the check is structurally blind to exactly this case — it can only find
a page that is wrong, never a page that should not exist.

That is the `yl5w` shape pointed the other way: there a claim resolved to no
file, here a file answers to no claim.

## The precedent exists — do not invent a second one

#607 hit this in `gen-iris-pages.ts` ("The generator wrote and never deleted")
and built the answer: an `OWNED` set scoped to the generator's OWN naming,
never to the directory, with `prunableStickies` as the earlier precedent. Reuse
that shape rather than writing a third.

The scoping is the load-bearing part and it is
`deletion-requires-confirmation` applied correctly: an agent does not remove a
durable artefact it did not create. A generated page identifies itself by its
own `SCOPE` constant — which is how the orphan was identified here — so
ownership is checkable rather than assumed from the directory it sits in.

## Done when

- [x] Both viewer generators prune orphans they own, scoped by their own
      naming — `scripts/viewer-prune.ts`, shared by both.
- [x] `--check` reports an orphan as a finding and counts it toward the stale
      exit. Verified on a planted orphan:
      `✗ orphan docs/cat-harness/schemas/ghost-subject/index.html`.
- [x] The PAIR is asserted, in `scripts/tests/viewer-prune.test.ts` and again
      end-to-end: the planted orphan was pruned, the hand-authored sibling
      survived, the still-declared subject survived.

## Not in scope

Any page the generators did not write. If ownership cannot be established from
the file itself, it is reported and left, never deleted.


## Summary of Changes

`cat-harness/scripts/viewer-prune.ts` — `findOrphans` / `pruneOrphans`, called
by both viewer generators after they emit their subject pages. 12 unit tests
plus an end-to-end check against the real tree.

### The correction this bean needed

It said *"#607 hit this in `gen-iris-pages.ts` ... and built the answer"*.
**That is not true of the tree**: `gen-iris-pages.ts` contains no `OWNED`, no
prune and no orphan handling. Whatever #607 described, the code is not there,
and following the citation would have led to nothing.

The REAL precedent is the one the bean named second: `prunableStickies` in
`ensure-landing-sticky.ts`, whose third filter —
`readExistingSticky(...) !== undefined` — is exactly the ownership test, and
that is what was reused. Same `b963` class as the `6pfo` mis-citation: a
reference that keeps parsing and resolves to the wrong place.

### Two decisions worth keeping

**Ownership from the file, never the directory.** The directory scopes the
SEARCH; the file's own bytes decide the DELETE. A hand-authored page, another
generator's output, or an unreadable file is reported and LEFT.

**Two signatures.** New pages carry `viewerMarker(<generator>)`. A
marker-only test could never have removed the file that motivated this bean —
an orphan is never rewritten, so it never acquires the marker. The legacy pair
(`DATA_HREF` + `SCOPE`) covers pages written before it, with no migration.
