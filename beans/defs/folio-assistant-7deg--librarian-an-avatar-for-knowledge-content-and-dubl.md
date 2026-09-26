---
# folio-assistant-7deg
title: 'LIBRARIAN: an avatar for knowledge content, and Dublin Core introduced in folio-assist-core'
status: todo
type: feature
created_at: 2026-09-20T06:23:14Z
updated_at: 2026-09-20T06:23:14Z
parent: folio-assistant-o3xy
---

## The ask, owner 2026-09-20 (verbatim)

> also need avator of librarian for knwoledge content specific stuff in
> folio-asst-core where dubln core skill should be introduced for first time.

## Two things, and they are separable

1. **A librarian avatar** for knowledge-content-specific material in
   `folio-assist-core`.
2. **A Dublin Core skill**, introduced there for the first time.

## What exists — measured 2026-09-20

**Avatars are a solved, per-kind mechanism**, and this rides it rather than
inventing anything. `schemas/avatars.ts` is a `Record<kind, Avatar>` over 19
keys, each `{ glyph, tone, reads }` where `tone` is a hue angle;
`scripts/gen-avatars-css.ts` derives both colour schemes and both trash states
from that single hue; `scripts/check-avatar-coverage.ts` reports kinds with no
glyph AND glyphs with no kind, so a new avatar is checked in both directions.
The existing `folio-assist-core` key is already among the 19.

So the librarian is: a glyph path, a hue, and a `reads` line. The one judgement
is **which kind it attaches to** — `folio-assist-core` the layer, or `folio` the
renderable content kind, or a new content-specific kind. The ask says *"for
knowledge content specific stuff"*, which sounds like the content rather than
the layer.

**Dublin Core does not appear anywhere.** `grep -ri "dublin"` over the
repository returns nothing. So this is genuinely new, and it is a *metadata
vocabulary* rather than a visual: DC terms (title, creator, subject, date,
rights, ...) are what a knowledge-content node would carry. Worth noting that
`schemas/namespaces.ts` already manages IRI prefixes and `scripts/ns-export.ts`
exports them, so a DC prefix has an obvious home and should not be hand-written
at use sites.

## The question to settle before building

**Is the Dublin Core skill an instruction body, or a schema?** The two are
different artefacts here: a skill is a markdown node in the `cat-harness` graph
telling an agent how to do something, while a metadata vocabulary is a schema
plus a namespace. *"dubln core skill should be introduced for first time"* reads
as the former, but DC's content is naturally the latter, and a skill that merely
restates a schema is the duplication `AGENTS.md` opens by warning about.
Likely both: a schema that holds the terms, and a skill that says when to reach
for them.

## Done when

- [ ] the librarian avatar exists, attached to a named kind, with coverage
      checked in both directions and `avatars.css` regenerated
- [ ] the skill-vs-schema question is answered
- [ ] Dublin Core terms reachable through `namespaces.ts` rather than spelled at
      use sites
- [ ] introduced in `folio-assist-core`'s layer, which does not exist as a
      directory yet (issue #223) — so where it lives before the split is part of
      the answer
