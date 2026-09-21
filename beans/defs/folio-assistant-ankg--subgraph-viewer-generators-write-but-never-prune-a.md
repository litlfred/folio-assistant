---
# folio-assistant-ankg
title: Subgraph viewer generators write but never prune — an orphan page answers to no declaration
status: completed
type: bug
priority: normal
created_at: 2026-09-20T21:02:36Z
updated_at: 2026-09-20T22:49:45Z
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

## Summary of Changes

Both viewer generators prune orphans they own. One shared helper,
`orphanSubjectPages()` in `gen-schema-viz.ts`, used by `gen-library-viz.ts`
too — the bean asked for `#607`'s shape to be reused rather than a third one
written, so there is one implementation rather than a copy in each.

**Ownership is READ, never assumed from the directory.** A subject directory
is prunable only when its `index.html` declares itself the page for that very
directory — `var SCOPE = "<dirname>";`, the line `viewerHtml` already emitted.
Anything else comes back as `foreign`: reported, left in place, in both modes.
That is `deletion-requires-confirmation` applied where it bites, and it is why
"everything under the page dir that is not wanted" was not the rule.

The data directory was never at risk: `viewerPlacement` puts it at
`<site>/assets/<kind>/`, outside the page tree entirely.

**`--check` now reports an orphan as a finding**, which it structurally could
not before — `emit()` compares only the files it is about to write, so a file
the generator no longer writes was outside what it looked at.

### Verified by hand, the pair the bean asked for

Reproduced the real case: planted `folio-assist-sci/index.html` carrying
`var SCOPE = "folio-assist-sci";` beside a hand-authored `hand-authored/`.

- `library:viz:check` → `✗ …/folio-assist-sci is an orphan` (counted stale,
  exit 1) and `! …/hand-authored … left in place` (reported, not counted).
- `library:viz` → pruned the orphan, left `hand-authored/` with its bytes
  unchanged.
- Re-ran clean afterwards.

`scripts/tests/viewer-orphans.test.ts` pins nine cases, including the two the
bean names, plus: a page whose `SCOPE` names a *different* subject is foreign
rather than owned; a directory with no `index.html` is foreign; files beside
the subject directories are ignored; and a never-written page tree is not a
finding. The last pair is asserted against the **committed** tree, because a
fixture passes on the day somebody re-keys a real subject.

### One thing this does NOT cover, and it is now its own bean

`state-visualizer.ts` has the same defect and **cannot take this fix** —
bean `y90d`. Its dashboards carry no self-identifying marker, and it publishes
at the SITE ROOT rather than under a page directory of its own, so "not
declared" cannot mean "prunable" there. Checked rather than assumed.
