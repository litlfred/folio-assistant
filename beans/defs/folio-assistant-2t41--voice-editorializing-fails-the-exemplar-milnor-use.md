---
# folio-assistant-2t41
title: 'voice-editorializing fails the exemplar: Milnor uses ''clearly'' 14 times as proof economy'
status: todo
type: bug
created_at: 2026-09-19T00:32:17Z
updated_at: 2026-09-19T00:32:17Z
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
