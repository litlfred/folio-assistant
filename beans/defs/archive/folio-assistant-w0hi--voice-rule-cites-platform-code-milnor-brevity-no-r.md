---
# folio-assistant-w0hi
title: 'VOICE RULE CITES PLATFORM CODE: milnor-brevity-no-repeats is derived from qa-criteria-registry.ts, not from the paper'
status: completed
type: task
priority: normal
created_at: 2026-09-21T16:55:33Z
updated_at: 2026-09-21T20:50:11Z
parent: folio-assistant-bzyu
---

Surfaced by moving milnor to folio-assistant-sci (bean btuv).

Every other rule in the milnor voice cites the Milnor paper — libraryId milnorlink, with a page. milnor-brevity-no-repeats instead cites kgRef content/pipeline/qa-criteria-registry.ts and quotes the criterion text out of the platform's registry.

So the rule is not derived from the publication the voice declares as its source. It is derived from the QA criterion that checks it, and the criterion is in turn a restatement of the voice — the two point at each other and neither is the source. That is btuv's defect arriving from the opposite direction.

The citation now carries instance: cat-harness and resolves, so nothing is red. That records where the file IS; it does not make the provenance right.

Depends on btuv: if the voice-overlay criteria are derived from the voices rather than hand-written, this kgRef points at a file that no longer contains the quoted text.

## Done when

- the rule cites the Milnor paper if that is where it came from, with a page;
- or it is marked as an asserted house rule rather than a derived one, and says so;
- either way no rule in a voice cites the platform code that checks it.


## 2026-09-21 — cited to the paper, on the owner's choice

Owner, asked with the three options: **"Find it in the Milnor paper and cite a
page."**

### The prediction in this bean was wrong, and the reason matters

It said: *"Depends on btuv: if the voice-overlay criteria are derived from the
voices rather than hand-written, this kgRef points at a file that no longer
contains the quoted text."* `btuv` landed and **the quote survived** — it lives
in the `expo` domain of `qa-criteria-registry.ts`, not in the four
`voice-overlay-*` entries that were deleted. So nothing broke; the defect was
always the circularity, never a dangling reference.

### What was found, by reading the paper rather than assuming

`milnorlink#page-181`:

> The proof is easily given: it is only necessary to check this assertion
> through each stage of the proof of Theorem 1.

That is the discipline in Milnor's own words. The assertion about meridian and
parallel pairs could have been proved by reproducing the proof of Theorem 1
with the new pairs substituted in; instead the reader is sent back through the
existing proof. Verified verbatim against the ingested section.

It is not an isolated sentence. The paper invokes numbered results by number
throughout rather than re-deriving them — *"by Lemma 7"*, *"It follows from
Lemma 4"*, *"hence by Theorem 5"*, *"Since the word problems for these rings
are solved by Theorem 7"* — eleven such invocations across pages 180-189.

### The half that is NOT Milnor's, and now says so

The resolve discipline — *a repeat may be deleted only where the two
occurrences are semantically identical; never delete maths* — is this
project's editing rule, not the paper's. It moved into the rule's
`description`, marked as this project's, because a `quote` is what was READ.
Putting it in the citation is what made the rule cite its own checker.

### Done when

- [x] the rule cites the Milnor paper, with a page — `page-181`, p181
- [n/a] marked as an asserted house rule — the owner chose the citation
- [x] no rule in ANY voice cites the platform code that checks it —
      **37 of 37 rules now cite the library, 0 cite a KG node** (was 36/1)

### Raised, not decided

Closing this makes `milnor` 12-of-12 citing an ingested document while it
declares `provenance: "house"`, whose schema gloss says `house` cites *"the
node that states it rather than an ingested document"* and names **the milnor
voice** as its example. That sentence is now false. Bean `iy1n`.
