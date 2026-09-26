---
# folio-assistant-iy1n
title: The milnor voice declares provenance 'house', and all 12 rules now cite an ingested document
status: completed
type: task
priority: normal
created_at: 2026-09-21T20:49:56Z
updated_at: 2026-09-21T23:09:34Z
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

## Settled — owner, 2026-09-21

Asked as four options, with the corpus measured first: every voice cites
ingested documents; `house`'s named example (`milnor`) fits it least; the only
rules matching the `house` gloss sit in `technical-writer`, declared
`assertion`; `evidence` has no member. The recommendation was (d) — move
`provenance` onto the rule.

The owner **refused (d)**, and the reason is the durable part:

> voices may be comprised of many composite voices w/ unclear attribution.
> attrinution by rule makes no sense in a collaborative/synethsizing process.

And settled the rest as (a) + (c) together:

> a) start formalizeing evidence.  already a process.... citation is evidence,
> c) keep, but is a QA flag

### What was done

- `VOICE_PROVENANCE`'s gloss in `schemas/voices.ts` carries the ruling, quoted
  and dated, including why the value is a property of the VOICE and not of its
  rules.
- **`evidence` formalised**: it means the rules are CITED — the document, the
  place in it, and the passage verbatim, so a reader can go and check. It said
  "a measurement somebody else can repeat", which is one kind of citable source
  and not the only one. The apparatus is `VoiceRuleSourceSchema` and already
  exists; formalising means naming it as what the value MEANS.
- **`milnor` keeps `house`**, and the gloss now says why: the citations are
  evidence FOR this project's standard, not its source. Milnor wrote no style
  guide; adopting his exposition was our decision.
- **The QA flag**: `voiceProvenanceFlags` in `schemas/voices.ts`, surfaced on
  `VoiceView` and rendered by the voices viewer as a warn-coloured question,
  never crit and never a gate. `house` is exempt by the ruling. It fires on
  exactly one voice today — `technical-writer`, 3 of 9 rules citing our own
  graph — so it is not a check that cannot fire.
- The `kgRef` doc comment was stale (it still called `milnor` the worked
  example for a voice whose hallmarks "were not extracted from his writing";
  all twelve now carry a `libraryId`). Rewritten, with `technical-writer` named
  as the live case.
- The viewer did not show `provenance` at all. It does now.

Verified by rendering the page headless, not by reading the generator's output:
one `.pflag` block, no console errors, provenance on every voice header.
