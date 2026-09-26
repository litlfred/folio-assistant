---
# folio-assistant-2t41
title: 'voice-editorializing fails the exemplar: Milnor uses ''clearly'' 14 times as proof economy'
status: completed
type: bug
priority: normal
created_at: 2026-09-19T00:32:17Z
updated_at: 2026-09-19T01:26:32Z
---

`voice-editorializing` (`content/pipeline/qa-checkers-voice.ts`, `EDITORIALIZING_RE`) lists `clearly`, `obviously` and `trivially` and fails a block for them at `minor`.

Measured 2026-09-19 against the paper the `expo-milnor-clarity` gate is named after — John Milnor, 'Link Groups', Annals of Mathematics 59(2), 1954, ingested as `library/milnorlink/`: **14 uses of `clearly` in 8899 words**, on pp. 177, 179 (x3), 181 (x2), 184 (x2), 188 (x2), 190, 193 (x3). Every one routes the reader's effort away from a verification that is routine:

- p177 'Clearly the relation of homotopy is reflexive, symmetric and transitive.'
- p179 'The inclusion map (Z, hi(Y)) -> (Qi, Pi) is clearly a homotopy equivalence.'
- p184 'The 2-link illustrated in Figure 3 is clearly trivial.'
- p190 'The single invariant mu(12) is clearly the linking number.'

**Not one means 'this is remarkable.'** Editorializing spends the reader's attention on the author's opinion; this spends none and saves some. So the criterion fails its own exemplar 14 times, which is the `fl5m` shape again (261 hits -> 6) and the `nwus` shape (4 hits -> 0): a word in a phrase list matching the construction the word is actually for.

`MATH_IDIOM_EXEMPT` already covers adverb+article+noun ('trivially zero') and math-verb+adverb ('factors trivially'). It does NOT cover the two forms Milnor actually uses: **adverb + article-less predicate** ('is clearly a homotopy equivalence' is covered; 'Clearly the relation ... is' at sentence start is not) and the bare predicative **'This is clear for the case n = 0'**.

## The distinction a fix has to make
`clearly` before a check the READER CAN PERFORM is correct. `clearly` attached to a claim the reader cannot verify in their head is the real defect — it is the author asserting where they should be proving. No phrase list separates those, so the honest outcome is probably: exempt the sentence-initial and predicative forms in a math-bearing block, keep the criterion for non-math prose, and leave the remainder to `milnor-h8-respect-for-the-reader` as judgement.

## Done when
- The exemplar passes `voice-editorializing` on all 19 of its pages, or each surviving finding has a reviewer entry saying why it is real.
- A test asserts 'Clearly the relation of homotopy is reflexive, symmetric and transitive' passes and 'Clearly this is the most important result in the field' fails.
- `voices/milnor.json` rule `milnor-clearly-is-proof-economy` records the finding for a reviewer meanwhile; it should stay as the judgement half even after the checker is narrowed.

_2026-09-19T01:26:31Z_ — ## Summary of Changes

**The bean under-counted: 26 hits across 11 of the exemplar's 20 pages, not 14.** It counted only `clearly`. Measured in full they split three ways, and only the third is a defect:

| class | n | examples |
|---|---|---|
| proof economy | ~20 | `Clearly the relation of homotopy is reflexive`; `it is easy to see that ai is unique`; `can clearly be represented`; `it follows easily that L is trivial`; `is easily verified` |
| term of art | 4 | `naturally isomorphic to G(Lt)` — the adverb IS the name; plus one line-wrapped `just the` |
| genuine | 1 | `Unfortunately these invariants are not strong enough` (p194) — the criterion is RIGHT |

**A gap in the opposite direction decided the design.** A bare superlative PASSED: `"This is the most important result in the field"` and `"The single most striking consequence follows"` both went green, because the regex only matched `perhaps the most …`. The criterion's own description says 'Results speak for themselves'.

That matters because exempting sentence-initial `Clearly` naively would have made this bean's own stated test case — `"Clearly this is the most important result"` — pass. Adding the missing superlative fixes both, and the file's existing STRIP-not-mask invariant then carries it: strip the `Clearly` and the superlative survives to fail the line. So **the exemption is the CONSTRUCTION, not the word**, which is as close as a regex gets to the real distinction.

Four patterns, every shape measured from the corpus rather than guessed: sentence-initial / after a stop / opening a paren; predicative (`is clear`, `are clearly homotopic`); the `it is easy to see/verify/that` frame; and adverb-with-verb in **either** order with auxiliaries between (`can clearly be represented`, `it follows easily`). Plus `MATH_TERM_OF_ART_EXEMPT` for adverb + mathematical adjective, which `MATH_IDIOM_EXEMPT` (adverb + article + noun) does not reach.

**The wrap cuts both ways**, which the previous `merely` fix only handled in one direction. p178 ends `…is just the` and p193 ends `…Wi,ri clearly`, both holding only the construction's head with the rest on the next line. `TRAILING_IDIOM_HEAD` is the mirror of `COMPARATIVE_TAIL`.

## Verified against the gate I stated in advance
**26 -> exactly 1**, not 0. A criterion that never fires on its own exemplar has stopped measuring anything; the survivor is p194's `Unfortunately`, which is real. `content/docs`: 122 blocks, all `pass`, zero failing criteria. 20 behavioural cases and 10 new tests, including the bean's test case and the not-zero assertion.

The `milnor-clearly-is-proof-economy` voice rule stays, as this bean asked — retitled and rewritten to say the checker now knows, and that what remains is the distinction no regex makes.
