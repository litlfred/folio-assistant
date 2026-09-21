---
# folio-assistant-ankg
title: Subgraph viewer generators write but never prune — an orphan page answers to no declaration
status: in-progress
type: bug
priority: normal
created_at: 2026-09-20T21:02:36Z
updated_at: 2026-09-21T05:22:24Z
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

- Both viewer generators prune orphans they own, scoped by their own naming.
- `--check` reports an orphan as a finding, since today it cannot see one.
- A planted orphan is pruned and a hand-authored sibling survives, both
  asserted — #607 verified exactly this pair by hand.

## Not in scope

Any page the generators did not write. If ownership cannot be established from
the file itself, it is reported and left, never deleted.

## Progress — 2026-09-21: a THIRD instance, in `state-visualizer.ts`

This bean named `schema:viz:check` and `library:viz:check`. It did not name
`state:visualizer:check`, which shipped in #581 with the same defect. Measured
rather than assumed: the generator contains no `unlink`, no `readdir` and no
prune of any kind, and the blindness reproduces exactly —

    planted docs/zzz-orphan/index.html carrying the generator's own marker
    write path:  "Wrote 6 dashboard(s)"   orphan still there
    --check:     "6 dashboard(s) up to date"   exit 0

So the count was right, the pages were right, and a page answering to no
declaration sat beside them unreported.

**Fixed here, reusing `prunableStickies` rather than minting a third shape.**
`prunableDashboards(site, wantedIds)` selects a directory only when it holds an
`index.html` carrying `GENERATED_BY` — the sentence this tool itself writes,
now a single constant because the pruner matches on it. `--check` fails on an
orphan; the write path removes it and names it.

**The safety argument is measured, not asserted.** `SITE` is the documentation
site and holds 19 directories — `assets`, `guides`, `reference`, `api`, `fr`,
`es`, `ru`, `_data`, `_includes`, `cat-bootstrap`, `cat-harness` and more, none
of them ours. Asked for the worst case, an EMPTY keep-set where nothing is
wanted, the pruner selects **exactly the 6 pages this generator wrote** and
none of the other 13. That is `deletion-requires-confirmation` applied rather
than bypassed: ownership is read out of the file, never inferred from the
directory.

Falsified in both directions — selecting on the directory instead of the
marker fails 2 tests, and dropping the keep-set fails 2.

## Still open

`gen-schema-viz.ts` and `gen-library-viz.ts` — the two generators this bean was
opened for — are UNCHANGED. They belong to sibling sessions and #616 is live on
one of them; porting this shape into their files mid-flight would collide. The
shape is now merged and has two call sites to copy from.

