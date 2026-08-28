---
# folio-assistant-p9a2
title: content_validate reports 0 errors when the pipeline never ran
status: in-progress
type: bug
created_at: 2026-08-28T20:08:28Z
updated_at: 2026-08-28T20:08:28Z
---

Found by authoring real content in folio-test. content_validate resolves validate.ts from the FOLIO's content/pipeline/, which folio_init does not create — so the spawn fails with 'Module not found', stdout is empty, the ✗/⚠ counts are 0, and the tool reports 'Validation: 0 error(s), 0 warning(s)'. A check that never looked, reporting clean.

## Summary of Changes

`content_validate` reported `Validation: 0 error(s), 0 warning(s)` on a
twelve-block corpus while the pipeline had executed **no checks at all**. The
stderr — `Module not found ".../content/pipeline/validate.ts"` — was appended
below the headline, where nothing reads it.

### Two causes

**Resolution.** The tool resolved `validate.ts` from the FOLIO's
`content/pipeline/`. That directory exists in the `qou` layout, where the
platform was vendored inside the content repo. It does **not** exist in
anything `folio_init` scaffolds — those carry `content/schema/` only. So the
primary validation tool was inert for every folio the scaffolder creates, from
the moment `fs18` landed. Now prefers the folio's own copy, so a folio that
deliberately forked the pipeline keeps its fork, and falls back to the
platform's.

**The false pass.** Nothing distinguished "ran and found nothing" from "never
started" — counting `✗`/`⚠` over an empty stdout gives zero either way.

### The distinction that was easy to get wrong

`validate.ts` **exits non-zero precisely when it finds problems**. So a
non-zero status is a normal, informative outcome, and treating it as a failure
to run would have suppressed every real finding — the same defect pointing the
other way, and harder to notice. `pipelineFailedToRun` keys on non-zero **with
no stdout at all**, plus spawn error and death-by-signal. Both directions are
pinned by test.

A pipeline that did not run now counts as an error in its own right, so the
headline can never read 0 while a check was skipped, and it is labelled
INCOMPLETE with the reason directly beneath.

### Measured

Same corpus, same folio, before and after:

    before:  Validation: 0 error(s), 0 warning(s)      (nothing ran)
    after:   Validation: 0 error(s), 2 warning(s)      (0 errors, 2 real
             ⚠ lem:euclid-step: no Lean declaration yet
             ⚠ thm:bezout:      no Lean declaration yet

Gates: 1118 pass / 0 fail, tsc clean, eslint clean.

### How it was found, and what that suggests

Not by reading the code — by authoring real content in a scaffolded folio and
noticing that a twelve-block corpus with two deliberately-unformalized
theorems reported nothing at all. The second time this session that using the
thing found a defect reading it had not (`content_list`'s `unknown` kinds was
the first, bean `58h0`).

Both were false *negatives* in reporting tools, and both survived because the
output looked like success. Worth considering a sweep of the remaining tools
that shell out to a pipeline, asking of each: what does this print if the
thing it runs is missing?
