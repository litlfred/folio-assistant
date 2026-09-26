---
# folio-assistant-9rrb
title: 'CATALOGUE DISCOVERY: derive-po held a list of five page names, so #1404''s four new pages took drift from 1 to 21 unseen'
status: todo
type: bug
created_at: 2026-09-26T14:13:00Z
updated_at: 2026-09-26T14:13:00Z
parent: folio-assistant-bzyu
---

Found 2026-09-26, minutes after #1369 merged, by watching what happened next.

#1369 took `translation-drift` from 25 findings to 1. **PR #1404 then merged four
more translated pages across five locales with no catalogues, and the gate went to
21.** The tool that had just catalogued 24 pairs could not see any of them, because
its CLI held a list:

```ts
const pages = ["accessibility", "content-types", "contributing", "getting-started", "installation"];
```

**A list of pages in a script goes stale on somebody else's merge.** That is the
same shape as `v625` (a documented chain that was wrong three times) and `do70`
(seven artefacts nothing names), one level out: the tool knew HOW to make a
catalogue and had to be told WHICH.

## Fixed, and measured

`publishedPairs` discovers them: for each locale the instance DECLARES, every `.md`
in that locale's directory with a same-named source page beside the site root.

    pages x locales:  5 x 5 hard-coded  ->  10 x 5 discovered
    translation-drift: 21 findings -> 4
    written 17, left 29 existing catalogues alone (the overwrite guard)

## The split that matters, and the defect that taught it

**Pages are discovered from the filesystem; locales come from the DECLARATION.**
My first version matched a two-or-three-letter directory name and picked up
`wireframes/fsh-guts` as a locale — `fsh` plus a suffix fits that shape exactly, so
the run reported "6 locale(s) … ar, es, fr, fsh-guts, ru, zh". A locale is a
declared vocabulary (`harness.config.json`'s `translation.supportedLocales`,
defaulting to the six UN languages), so guessing it from the filesystem was
inventing an answer the instance already gives.

Which pages exist IS a fact about the tree. Which locales count is a declaration.
Pinned as a test, including the `fsh-guts` lookalike.

## What the 4 remaining refusals are

- `ar/architecture`, `ar/skills` — the translation is LONGER than its source by one
  construct, so `alignGrownSource` correctly refuses: the alignment is sound only
  for things added to the source, never for things the translation has and the
  source lacks.
- `zh/skills` — **`msgid-conflict`**: "Skills" occurs twice and is translated two
  ways, 技能 and 技能数. This is the guard added after bean `f6r1` found the case in
  a pair where `count-differs` was masking it, now firing on genuinely new data. It
  needs `msgctxt`, not a derivation.
- `zh/getting-started` — the pair carried over from #1369, diagnosed on `7x8o`.

None is an agent's to resolve: #206 reserves translation adjudication to a human.

## Done when

- [x] the pages and locales to catalogue are discovered rather than listed
- [x] locales come from the declaration, so a lookalike directory is not one
- [x] MEASURED AFTER: drift 21 -> 4, and every remaining refusal is a named finding
      rather than a page the tool could not see
- [ ] a translate batch landing without catalogues is caught BEFORE merge, not
      after — this is the fourth recurrence of the same shape and the ratchet still
      pays the next author. `do70` carries the author-side command; the merge-side
      gap is `nytj`
- [ ] the four refusals are dispositioned by a person
