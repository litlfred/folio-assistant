---
# folio-assistant-3vc6
title: 'TRANSLATION AS AN INSTANCE: re-express the round trip against the spine and lose the duplicated half'
status: completed
type: task
priority: normal
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-22T07:22:05Z
parent: folio-assistant-3x2n
---

Once `0grh` exists, `translation-manager.md` §"The agentic round trip" holds two
things that should be separated:

**Generic, and belongs in the spine** — the producer/checker/adjudicator table,
the three rules, the no-tools declaration, the witness-ordering convention
(adjudicator first, back-translator behind it with `result: "n/a"` and the
intermediate text in `notes`), the `model` + `modelSource` rule, and the two
traps: a script sweep replaces only entries whose reviewer is *itself*, and a
verdict is hashed to the text it was about.

**Translation-specific, and stays** — what counts as drift and what does not
(synonyms, articles and re-ordering are not; a claim added, dropped, weakened,
strengthened or reversed is; a term of art swapped; a named entity or quantifier
moved). Without that list a round trip degenerates into a style review and every
translation "fails".

Also carried forward rather than lost: the recorded failure that motivated the
whole discipline — `roundTripQA: { fail: 21, total: 36 }`, where the
back-translation map held **6 entries for 36 strings**, so `fail: 21` was a count
of absences. A measurement whose author has to explain it away is about the
instrument, not the subject.

`vo9d` already settled where the mechanism is dispatched from (*"1 2 3 are all
triggers"*). This does not reopen that.

## Done when

- [x] The generic half is stated once, in the spine, and the translation skill
      points at it rather than restating it — `translation-manager.md`
      §"The agentic round trip" is now *"this section is only what translation
      adds"*. The spine's copy of the `roundTripQA` incident is trimmed to the
      lesson with a pointer back, so the incident lives where it happened
- [x] Every translation-specific rule survives the move — checked by reading:
      the drift definition (both halves), the per-locale staleness of
      `.md`/`.ts`/`.po`, the `translation-block-qa` clobber instance, and the
      `roundTripQA` incident with its numbers
- [x] No behaviour change: the existing round-trip witnesses still validate —
      and the sweep was re-run to prove it rather than argued. The agent pair
      on `overview.fr` survived, adjudicator first, back-translator `n/a`
      behind it

## What instantiating it found — the abstraction was too narrow

The falsifier in this bean's brief was: *if a rule has no home after the move,
the split is wrong and the spine is the thing to fix.* It fired, on the first
try, and not on a rule — on the **type**.

`UntaintedDispatch` was typed over `CompanionRole`. The round trip's central
visible artefact is the **`.po`**, and `po` is deliberately NOT a
`CompanionRole`: `translation-block-qa.ts` states the reason at length — a PO
is a companion of a *(block, locale)* pair, not of a block, so adding it to
`COMPANION_ROLES` would widen applicability for every criterion in every folio.

**So the discipline's own founding case could not be expressed in the type
generalised from it.** The abstraction was widened rather than the case bent:
`UntaintedDispatch<A extends string = CompanionRole>`, and
`untaintedPartitionDefects` takes its artefact universe as a parameter, because
the vocabulary belongs to the criterion and the caller is the only party that
knows it.

That is what an instantiation is FOR. Asserting genericity is the move this
epic exists to stop; one round of instantiating found a real defect in the
first hour.

## The declaration

`ROUNDTRIP_DISPATCH` in `translation-block-qa.ts`:

| party | sees | never sees |
|---|---|---|
| back-translator | `po` | `md`, `ts` |
| adjudicator | `md` | `po` |

Disjoint — the whole rule in one line. Four tests pin it, including one that
turns red when the back-translator is handed the source: the vacuous pass
`translation-manager` used to warn about in prose is now caught.

`bun run gates` — 99 of 99.

## Summary of Changes

`ROUNDTRIP_DISPATCH` in `translation-block-qa.ts` declares the round trip
against the spine; `translation-manager.md` now points at
`untainted-verification` rather than restating it, keeping only what
translation adds.

**Instantiating it found the spine too narrow** — `UntaintedDispatch` was typed
over `CompanionRole` and the round trip's central artefact is the `.po`, which
deliberately is not one. Widened to
`UntaintedDispatch<A extends string = CompanionRole>` rather than bending the
case.

Verified on `main` at `2ce66fc`. Merged in #829.
