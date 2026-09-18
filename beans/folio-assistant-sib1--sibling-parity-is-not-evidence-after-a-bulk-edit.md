---
# folio-assistant-sib1
title: sibling parity is not evidence after a bulk edit touched the family
status: completed
type: task
created_at: 2026-08-10T04:45:00Z
updated_at: 2026-08-10T04:45:00Z
---

Branch `claude/sibling-parity-caveat-2026-08-10`. Follow-up to `uer2`, from
`qou/prn1`.

Two independent readers judged a five-member family of millennium-problem bound
remarks *deliberately* empty, on the grounds that every member names the same
six blocks in prose and every member declares nothing. Declaring in one would be
the anomaly. The inference is sound and the conclusion was wrong.

Every member lost 8-10 `uses[]` edges to a single bulk "transitive-prune" commit
whose rule (*if A→B and B→C, drop A→C*) fired in cases where B→C was being
dropped in the same pass. Corpus-wide that commit and one other destroyed
reachability for 856 edges, 785 of which are still unreachable today across 335
blocks.

The parity was real. It was uniform **damage**, not uniform intent — and a bulk
operation produces parity by construction, so the heuristic cannot tell the two
apart.

Now in the skill: check the family's *history* before resting on parity. A
convention shows up as blocks authored empty; damage shows up as one commit
emptying all of them on the same day. Generalised at the end, because the same
trap applies to any argument from "what the corpus does" — a corpus that has been
swept records the sweep as much as the authors.
