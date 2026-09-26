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


## Measured addition (not this bean's author): the manifest case is caught by NOTHING

Appended 2026-09-25 by the session that made the `package-manifest.json`
duplicate this bean describes. The body above has the mechanism right; this adds
the one measurement it does not carry, because it changes what "Done when" has
to cover.

**The bean-store case is caught downstream. The manifest case is not caught at
all.** For front matter, YAML itself rejects a duplicate key, so
`check:bean-front-matter` fails and the defect surfaces late but surfaces. JSON
has no such rule: a duplicate array element is valid JSON.

Measured on the merge commit that carried the duplicate:

| | |
|---|---|
| `package-manifest.json` `skills` entries | 152 |
| unique entries | 151 |
| `bun run gates` | **152 gate(s) pass** — exit 0 |

So the duplicate rode a fully green fast gate set. The reason is that
`skill-manifest-coverage` asks *"is every skill on disk listed?"* — a duplicate
answers that question twice and never answers it wrongly. **Coverage is not
uniqueness, and a coverage check cannot be made to notice this by tightening
it**; the question has to be asked separately.

That also means the two cases sit at different severities than the body implies.
Front matter: caught, late. A hand-maintained JSON list: silent, and the only
reason this one was found is that I diffed my own branch against `main` and
could not reconcile the line count.

Two further consequences worth having written down:

- **Alphabetical position is not checked either.** `main` appended
  `decision-methodology-selector` after `workflow-*` rather than after
  `decision-comparison`; nothing failed. So the array's stated ordering
  convention is unenforced, which is *why* two sessions inserted at different
  indices and the merge kept both. Enforcing the order would have turned this
  into an ordinary conflict.
- The duplicate was resolved here by keeping **`main`'s** entry and dropping the
  one added on the branch — not because it was better placed (it is worse
  placed), but because it landed first.

### Adds to "Done when"

- [ ] duplicate detection covers hand-maintained JSON lists, not only YAML front
      matter — `package-manifest.json` `skills` is the known instance
- [ ] the `skills` array's ordering convention is either enforced or dropped,
      since an unenforced order is what lets two insertions coexist
- [ ] MEASURED AFTER: a deliberate duplicate in `package-manifest.json` makes
      `bun run gates` exit non-zero
