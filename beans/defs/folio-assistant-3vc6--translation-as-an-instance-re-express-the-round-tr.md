---
# folio-assistant-3vc6
title: 'TRANSLATION AS AN INSTANCE: re-express the round trip against the spine and lose the duplicated half'
status: todo
type: task
priority: normal
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
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

- [ ] The generic half is stated once, in the spine, and the translation skill
      points at it rather than restating it
- [ ] Every translation-specific rule survives the move — checked by reading,
      not by diff size
- [ ] No behaviour change: the existing round-trip witnesses still validate
