---
# folio-assistant-fsh2
title: uses-editorial-review described a foreshadows rule that was removed
status: completed
type: bug
created_at: 2026-08-15T12:50:00Z
updated_at: 2026-08-15T12:50:00Z
---

Branch `claude/foreshadows-skill-after-ruling-2026-08-15`.

An owner ruling on 2026-08-10 made `foreshadows[]` **independent of `uses[]`**
and removed `foreshadows-subset-of-uses`. The skill agents read before doing this
work still described the field as "a subset of `uses[]`, enforced by
`foreshadows-subset-of-uses`" — stale guidance pointing at a rule that no longer
exists.

**The ruling corrects a real design flaw in the original field**, which I built.
Requiring every foreshadow to also sit in `uses[]` made it an annotation on an
edge and nothing more, so it could not express the case it was most wanted for:
a chapter overview naming results it previews but does not depend on. Recording
such a pointer meant first asserting a dependency that is not real.

The field now splits, and the split is what the skill needed to say:

- **pure forward pointer**, not in `uses[]` — *derived* from the block's own
  markdown links, never authored, zero-cost by construction because it never
  enters the dependency graph;
- **deferred prerequisite**, in `uses[]` — *declared*, and underivable: no rule
  separates it from a forward edge that is merely a defect.

Also corrected: the "17 of 23 withdrawn" figure now carries its context. It was
measured under the subset rule, when every forward pointer had to be declared;
most of the withdrawn ones were pure pointers, which now derive themselves. Left
in, because the *bar* it establishes still governs the declared case.

Worth noting the derivation is not the trap the old guidance feared. It reads
links and backticked labels, never deferral language — the distinction that made
an earlier attempt classify "Below $n^*$", a numeric comparison, as a deferral.
