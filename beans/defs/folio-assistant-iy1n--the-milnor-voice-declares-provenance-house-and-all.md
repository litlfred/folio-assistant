---
# folio-assistant-iy1n
title: The milnor voice declares provenance 'house', and all 12 rules now cite an ingested document
status: todo
type: task
priority: normal
created_at: 2026-09-21T20:49:56Z
updated_at: 2026-09-21T20:49:56Z
parent: folio-assistant-bzyu
---

Surfaced by closing `w0hi` on 2026-09-21, and it is the schema's own worked
example that has gone wrong.

`schemas/voices.ts` defines the vocabulary:

  • `assertion` — a publisher describing its own product or house style.
  • `evidence`  — a measurement somebody else can repeat.
  • `house`     — a standard this project set for itself, CITING THE NODE THAT
                  STATES IT RATHER THAN AN INGESTED DOCUMENT. **The `milnor`
                  voice is the case.**

That last sentence is now false. `milnor` declares `provenance: "house"` and
**12 of 12 rules cite `milnorlink`** — an ingested document in `library/`,
with a page. Before `w0hi` it was 11 of 12, so the mismatch was already there
and closing `w0hi` only made it total.

## Why this is not a rename

The three values answer an EPISTEMIC question the rules cannot answer for
themselves — "a rule read from a vendor page is a CONVENTION and a rule read
from a measurement is a FINDING; treating the first as the second is how 'best
practice' acquires the authority of a result." Getting `milnor` wrong is
exactly that failure on this repository's own exemplar.

`evidence` is the candidate, and it is not obviously right either. The
hallmarks are JUDGEMENTS about exposition derived from reading a paper, which
is repeatable in the sense that anyone can re-read it, but is not a
measurement in the way the vocabulary's own gloss implies. One rule,
`milnor-sentence-length`, genuinely is one — median 17 words over 496
sentences. The other eleven are not.

So the honest options are at least three, and it is a mathematics-content
classification rather than a code change:

  (a) `milnor` becomes `evidence`, and the `house` gloss loses its example —
      leaving `house` with NO example in this repository, which is worth
      knowing about a value the schema requires.
  (b) the vocabulary is wrong: a voice derived by reading a publication is
      neither an assertion, a measurement, nor a house standard, and a fourth
      value is needed.
  (c) `house` is right and its gloss is wrong — the voice IS this project's
      standard, and the citations are evidence FOR it rather than its source.

## Done when

- [ ] the owner has settled which of the three (or a fourth) is right
- [ ] `milnor`'s declared provenance matches its rules
- [ ] the `house` gloss in `schemas/voices.ts` names an example that exists,
      or says plainly that none does
