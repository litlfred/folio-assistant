---
# folio-assistant-uer2
title: uses-editorial-review — family-carried edges and the two-reader standard
status: completed
type: task
created_at: 2026-08-10T04:05:00Z
updated_at: 2026-08-10T04:05:00Z
---

Branch `claude/uses-review-family-edges-2026-08-10`.

The skill already warned to read a block's extracted `tbl:…-data` children
before calling an edge spurious. A later pass showed that rule was too narrow in
one direction and missing a second rule entirely.

**Too narrow: proof children carry edges too, and may be the only carrier.** In
`qou/fwr7`, `prop:gram-determinant-plancherel-ratio`'s own prose genuinely never
names `rem:gram-matrix-spectral-connection` — I checked, and reported it as a
clean deletion. Its **proof child** cites the target by label for the exact
identity the parent's boxed formula is built from, and that proof declares no
`uses[]` of its own. The parent's entry was the sole record of the dependency.
Deleting it would have erased the edge, not tidied it.

So the rule generalises: a block is the head of a family, and the *declaration*
sits on the parent while the *lean* may sit in any child. Check whether a child
leans on the target, and whether that child declares anything itself.

**Missing: the standard of evidence.** The skill said nothing about how many
readings an edge edit needs, and the project's own numbers are stark:

- 274-edge pass, destructive verdicts re-reviewed: 3 of 35 deletions and **17 of
  23** foreshadows overturned.
- 8-edge slice, 6 single-reader reports and 2 self-verified: two independent
  readers returned **keep on all eight**, agreeing row for row, every refutation
  on positive evidence rather than the tie-break.

Now stated: two readers who cannot see each other's verdicts, for anything that
edits the graph; agreement is the signal; disagreement or doubt means leave the
edge. Plus the retarget rule — it asserts two things at once and needs evidence
for each half, since one retarget in that slice had a true second half and a
false first, making it an addition rather than a swap.
