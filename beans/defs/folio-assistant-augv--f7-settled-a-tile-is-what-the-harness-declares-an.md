---
# folio-assistant-augv
title: "F7 settled: a tile is what the HARNESS declares, an avatar is what the FOLIO holds"
status: completed
type: task
priority: normal
created_at: 2026-09-21T22:20:00Z
updated_at: 2026-09-21T22:20:00Z
parent: folio-assistant-6lb8
---

R19's second clause, open since #796 and reported as open in the design record
rather than filled with a plausible sentence: *"OR use theme/avatars as
appropriate"* — when is a thing on the folio a tile, and when its own avatar?

Four options were put to the owner with their costs. They chose **declaration
ownership**.

## The rule

> **A tile is what the HARNESS declares. An avatar is what the FOLIO holds.**

A declared visualiser (`SubgraphCoverageSchema.visualiser`) — `fsh-guts`,
`todos`, `docs` — is a tile. A note, a document or a materialised asset under
`folio/` is an avatar. **A theme is how either one looks**, never a third
kind: a tile already takes *"the avatar's declared hue"*, and the owner's
2026-09-20 line says it from the other side — *"defaults to theme, but new can
be changed"*.

## Falsified — two candidates died on R30 before the choice was put

R30 puts *"avatars of materialized assets (including materialized KG like
bootstrap, cat-harness)"* on the glass, so **a whole knowledge graph renders
as an avatar**. That single sentence kills the two rules a reader reaches for
first:

- **cardinality** ("many → tile, one → avatar") — `cat-harness` materialised is
  a whole graph and is an avatar, so adopting it means overruling R30;
- **what selection does** ("opens a viewer over a set → tile") — opening that
  avatar *does* open a viewer over a set, same contradiction, and it
  additionally needs a per-item declaration of selection behaviour that
  nothing carries.

Declaration ownership survives because a materialised asset is in the reader's
`folio/` **however big it is**, and that is the fact being read.

## It is recognition, not invention

`harness-tiles` already carried *"a tile is the harness's, not the node's"*,
and the owner's 2026-09-20 correction already said both halves. The gap was
that nobody had read them as an answer to THIS question. That is why this is
the cheap option: no schema field, no new declaration, no re-authoring.

## The consequence that looks like an inconsistency

**The same subject can be both.** `todos` is a tile in the strip and an
individual todo is an avatar on the glass. One answer per OBJECT — the viewer
is harness-declared, the item is folio content — and they share a name.
Written into the skill because a reader will otherwise read it as drift.

## Summary of Changes

- `skills/folio-core/harness-tiles.md` — §"A tile, or an avatar? WHO DECLARED
  IT", with the table, the R30 case, the two rules it kills, the
  same-subject-both consequence, and why there is no check.
- `skills/folio-core/board-windows.md` — a pointer, not a copy. One rule with
  two homes is one rule free to drift.
- `docs/architecture/folio-board-requirements.md` — R19b recorded with its
  **provenance kept**: reported open, then ratified, the same treatment
  R15/R16 got. The "still open" section now holds only the library-view
  question R30 leaves.

## Done when

- [x] the rule is stated in the skill that already owned the tile half
- [x] `board-windows` points at it rather than restating it
- [x] the design record carries R19b with provenance, and its "still open"
      section no longer claims F7 is open
- [x] the falsified candidates are recorded, not just the winner

## Not done

**No gate, and the skill says why rather than leaving it an omission.**
Nothing classifies a folio item yet; the renderer reads which graph an item
came from, which is already unambiguous. A check here would be a declared
property whose check cannot answer its own claim — R17's lesson, one round
later.

**The library-view question is untouched.** Whether a reader browsing a
library can see which items they already hold is the other half R30 leaves
unsaid, and it is not this bean's.
