---
# folio-assistant-ankg
title: Subgraph viewer generators write but never prune — an orphan page answers to no declaration
status: todo
type: bug
created_at: 2026-09-20T21:02:36Z
updated_at: 2026-09-20T21:02:36Z
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
