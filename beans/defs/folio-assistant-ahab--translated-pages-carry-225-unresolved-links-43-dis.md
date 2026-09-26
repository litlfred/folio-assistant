---
# folio-assistant-ahab
title: Translated pages carry 225 unresolved links — 43 distinct, five near-copies each, and the English sources do not carry them
status: todo
type: task
priority: normal
created_at: 2026-09-26T10:40:05Z
updated_at: 2026-09-26T10:40:21Z
parent: folio-assistant-ahvw
---

Found 2026-09-26 while re-deriving `hloc`'s premise. `hloc` records the `docs/`
unresolved-link count as **120** after `mi97` took it from 246. Re-measured
today with `scanSubgraphs()` it is **340** — higher than the pre-`mi97` figure.

That is not an `mi97` regression. It is a different population, and it splits:

| source | links |
|---|---|
| translated pages — `docs/{ar,es,fr,ru,zh}/` | **225** |
| everything else | 115 |
| …of which `docs/reference/skill-instructions/` (`hloc`'s subject) | 76 |

## The two measurements that make this its own bean

**225 collapse to 43.** Strip the locale prefix and the findings dedupe to 43
distinct `from → target` pairs: five near-identical copies of the same links.
So this is 43 real defects reported 225 times, not 225 independent ones — and
any fix applied once to a source propagates, if the pipeline is what produces
them.

**The English sources do not carry them.** `docs/content-types.md` has **1**
finding. Each of its five translations has **28**. A translated page is
supposed to be the same document in another language; one that links
differently from what it was translated from is either being generated with
different link rewriting, or was translated from a different revision. Which of
those it is decides the entire fix, and nothing here establishes it yet.

## Why it is not `hloc`

`hloc` is about `gen-skill-docs.ts` flattening skill packages and leaving
non-skill links addressing the source layout — one generator, four target kinds,
all inside `docs/reference/skill-instructions/`. This is the translation
publish path (#1374 — the same merge behind the `t8g3` drift, beans `tbdg`,
`ngxj`, `f6r1`). Different generator, different cause, and fixing either does
nothing for the other.

Checked before creating: `f6r1`, `tbdg`, `ngxj`, `bgrz`, `xcyh` — none owns
unresolved links in translated pages.

## Done when

[ ] It is established WHICH of the two causes it is — different link rewriting
    on the translation path, or translation from a stale revision — by
    comparing one translated page against its English source at the revision it
    was translated from. Stated, not inferred.
[ ] The 43 distinct links are fixed at their cause, so the 225 go with them. A
    per-locale repair would be 5x the work and would drift again on the next
    publish.
[ ] Verified by BREAKING it: re-publish one page and confirm the finding does
    not come back. A count that fell because the pages were deleted is not a fix.

## Not claimed

That the translated pages are wrong to exist, or that #1374 should be reverted
again. Only that they carry links their sources do not, and nobody has looked.
