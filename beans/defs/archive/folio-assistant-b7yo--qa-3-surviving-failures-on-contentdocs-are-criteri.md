---
# folio-assistant-b7yo
title: 'QA: 3 surviving failures on content/docs/ are criterion-vs-house-rule conflicts, not scoping'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:23:54Z
updated_at: 2026-09-18T17:36:22Z
---

## What these are

After the profile axis landed (bean `g6yr`, PR #253) and this repo declared
`contentType: "document"`, the sweep over `content/docs/crdm-methodology`
went 8 → 3 failures. The 5 that went were false. **These 3 are not scoping
problems** — they need editorial judgement, and the owner asked for them to
be queued rather than resolved on the spot.

Command, 2026-09-18:

    bun run content/pipeline/qa-sweep.ts --root content/docs/crdm-methodology

    fail_critical: 2, fail_major: 1

## The three

**1. `roles.md:46` · `voice-status-leak` · critical**
Table cell `| **Needs review** (Phase 1) | …`. This is a CRDM checkpoint
*name* in a table of checkpoint names, not a status marker on prose. Reads
like a phrase-list over-match.

**2. `what-is-not-built-yet.md:36` · `voice-status-leak` · critical**
`**Not yet implemented:**`. True to the criterion's letter. But the page is
a deliberate gap inventory — its entire purpose is recording what is not
built — so the finding fights the block's reason for existing. Rewording it
to pass would damage the page to satisfy the checker.

**3. `what-is-not-built-yet.md:58` · `voice-author-notes-pollution` · major**
The P4 ISO-date pattern, on ``measured 2026-09-18 on `main` ``.

### #3 is the one that is probably a criterion bug

AGENTS.md **requires** exactly this pattern:

> a number without its date and command is a claim, not evidence

and the BASELINE rule for agent memory says a measurement is stored "with
the command that produced it and the date". So the criterion fires on
precisely the provenance the house rules mandate. Criterion and discipline
disagree, and the criterion is the newer of the two.

Likely fix: exempt the dated-provenance form from
`voice-author-notes-pollution` rather than rewording every compliant block.
That is a narrow, testable change to the checker — but it is a change to a
shipped QA gate, so it wants its own brief.

## What NOT to do

Do not reword the prose to go green. Two of the three are correct prose
fighting an over-broad criterion; the third is a page whose subject IS
unbuilt work. Going green by editing the content would be the checker
driving the corpus.

## Open

Whether #1 and #2 want `voice-status-leak` narrowed (e.g. an exemption for
table cells and for blocks whose own label marks them a gap inventory), or
whether they are simply accepted as known-red. Nobody has decided.
