---
# folio-assistant-syrl
title: check-subgraphs prints '23 carry one ../ too many' as a STRING LITERAL, not a measurement
status: todo
type: task
priority: normal
created_at: 2026-09-25T16:02:11Z
updated_at: 2026-09-25T16:02:37Z
parent: folio-assistant-ahvw
---


`cat-harness/scripts/check-subgraphs.ts:382` prints:

> NOT a clean bill either — bean `mi97` audits them, and 23 carry one `../`
> too many.

**That 23 is a string literal.** It was measured once, on 2026-09-20, and
written into the message. The check re-measures the TOTAL every run (it read
171 that day and reads **246** today) but the 23 never moves, so the output
cannot tell a reader whether any of those links have been repaired — or
whether the number is now 5, or 40.

This is the repository's own rule broken by its own tooling. `kg-audit`'s
reading rules say **never quote a count from prose**, and `turn-reporting`
says a count without its measurement is a claim. A literal inside a check's
output is the same defect with a longer half-life, because it arrives wearing
the authority of a measurement.

**I wrote it** (2026-09-20, in the commit that added the `siteResolved`
bucket), which is why it is filed rather than argued: the fix is cheap and the
lesson is that a number in a message is a number that has to be computed.

## Done when

- [ ] The `../`-too-deep count is COMPUTED at report time, beside the total —
      the check already resolves every link, so the arithmetic is there.
- [ ] Or, if it is not worth computing, the sentence names no number at all
      and points at `mi97` alone. Either is honest; a stale literal is not.
- [ ] `mi97`'s own falsifier still works: it says the count must fall by
      exactly 23 when the links are repaired, which is only checkable if the
      number is live.
