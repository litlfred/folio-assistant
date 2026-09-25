---
# folio-assistant-kfkh
title: A clean merge produces a DUPLICATE front-matter key — three instances, no conflict marker on any of them
status: todo
type: bug
created_at: 2026-09-25T17:44:01Z
parent: folio-assistant-1xhc
updated_at: 2026-09-25T17:44:01Z
---

Found 2026-09-25 while merging `main` into a PR branch. Distinct from `oxka`
(completed), which is the same territory from the opposite side: that one is
about generated files conflicting on **nearly every merge**, and `.gitattributes`
now marks three of them `-diff -merge`. This is about hand-authored files
merging with **no conflict at all** and producing a duplicate key.

`-merge` is not the remedy here and should not be applied: these files ARE
hand-edited, which is the whole reason a line-by-line merge is wanted.

## The mechanism

Two sessions add or rewrite the same front-matter key at different LINE
POSITIONS in the same block. Git sees two independent insertions, has nothing to
conflict on, and keeps both.

    main:          parent: folio-assistant-slw1     (line 6)
    my branch:     parent: folio-assistant-slw1     (line 8)
    after merge:   both, and the file says it twice

YAML rejects it (`Map keys must be unique`), so `check:bean-front-matter`
catches it downstream — but nothing marks it at merge time, and nothing in the
diff looks wrong.

## Three instances, and the key differs every time

| bean | duplicated key |
|---|---|
| `1hvo` (archived) | `title:` |
| `7u3g` (archived) | `updated_at:` |
| `7e59` | `parent:` |

A different key each time is what independent concurrent edits look like.
`updated_at:` is the most telling of the three: `beans update` rewrites it on
every status change, so two sessions touching one bean is enough on its own.

**Same shape outside the bean store.** In the same merge,
`skills/folio-core/package-manifest.json` ended with
`"decision-methodology-selector"` **twice** — `main` appended it to the `skills`
array, I inserted it alphabetically at index 36, and the merge kept both: 152
entries where 151 were meant. So this is not a bean-store quirk; it is any
hand-maintained list or map.

## A distinction the current checker does not draw

`check:bean-front-matter` says:

> Outstanding duplicates are repaired by the bean's OWNER, not by this check and
> not by whoever ran it — repairing one means choosing which value was meant.

That is right for `1hvo`, where the two `title:` values differ and picking one is
a judgement. It is **not** right for `7e59`, where both values were
`folio-assistant-slw1` — identical, so there is nothing to choose and any reader
resolves it the same way.

Collapsing the two cases makes the safe one wait for an owner who has no decision
to make, which is how `1hvo` and `7u3g` have stayed outstanding.

## Done when

- [ ] the two cases are told apart: an **identical-value** duplicate is reported
      as safely collapsible (and may be collapsed by whoever meets it), a
      **differing-value** one stays the owner's call with both values shown
- [ ] something notices at merge time rather than only downstream — the cheapest
      candidate is the front-matter check running in a pre-push or pre-commit
      hook, since it already detects this in ~0.3 s over 960 beans
- [ ] `1hvo` and `7u3g` are re-read under that distinction; if either is
      identical-value it stops being a blocked item
- [ ] MEASURED AFTER: a deliberate two-position insertion of the same key is
      caught before it lands, not after

## Not in scope

`oxka`'s three generated files, and `.gitattributes` generally. A merge driver
would need `merge.*.driver` set per checkout — `oxka` already rejected that as
working here and nowhere else, and that reasoning holds for this too.

