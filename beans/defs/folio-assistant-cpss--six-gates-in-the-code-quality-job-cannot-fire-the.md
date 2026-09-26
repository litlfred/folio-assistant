---
# folio-assistant-cpss
title: 'SIX gates in the code-quality job cannot fire: the deliberately-red drift batch is step 40 of 46 and a job stops at its first failure'
status: todo
type: bug
priority: high
created_at: 2026-09-26T18:09:12Z
updated_at: 2026-09-26T18:09:12Z
parent: folio-assistant-1xhc
---

Measured while fixing an unrelated finding (bean `9x01`), so the population below
is exact and the recommendation is not.

## What is unreachable

`.github/workflows/code-quality-gates.yml`, job `gates`: **46 steps**, and the
step named *"gates that were registered and never run"* is **step 40**. A job
stops at its first failing step, and that step's batch contains
`translation:drift:check`, which is **deliberately red** — the owner's decision,
bean `ngxj`, issue #206, after #1364 merged 25 `UNCATALOGED` entries and #1384
reverted them.

So six steps have not run on any PR, or on any push to `main`, for as long as the
drift has been red:

| line | step |
|---|---|
| 1446 | generated docs pages are current — **moved above the batch by this bean's sibling change** |
| 1460 | voices projection and viewer are current |
| 1471 | folio projection and viewer are current |
| 1483 | viewer pages keep the navbar they had |
| 1496 | handler namespace index is current |
| 1538 | translation index is current |

Five remain below it.

## The one that proves the cost

**"translation index is current" is masked by the translation drift.** The gate
that would catch a stale `docs/_data/translations.json` cannot fire while the
catalogues are missing — and a stale `translations.json` was found and fixed BY
HAND earlier the same day (#1408), after CI reported green on the branch that
carried it. The gate existed the whole time.

That is the argument that this is not a tidiness issue: a deliberately-red gate
does not cost one red check, it costs every gate after it, and the ones after it
are not chosen — they are whatever happens to be later in the file.

## Prior art, and why this is not `fjwi`

`fjwi` (completed) asked *"where can the registration-chain check go in CI? Every
placement today is masked or red on arrival"* and answered it for ONE gate, by
measuring that every placement available bought nothing. It brushes this problem
and does not state it: its subject is where a specific new gate belongs, and its
conclusion is about that gate. **This bean's subject is the six steps already
registered in the masked region**, which `fjwi` neither counted nor named — and
the count is the argument, because six is not a placement question, it is a
standing hole.

Worth reading together: `fjwi`'s step numbers (17, 33, 37, 40, 45) are from the
same job and show the masked boundary from the other side.

## Precedent, twice in this file already

- `om30` is named in the file's own comments as the original instance.
- `ee964c7411` (merged 2026-09-26) moved `translated-links:check` above the batch,
  with the comment *"ABOVE the drift gate DELIBERATELY. It was first registered
  below it"*.

So the convention exists. What does not exist is anything that ENFORCES it, which
is why the count reached six.

## Two candidate fixes, and why the second is better

**(a) Move each masked step above the batch.** What the precedent does, one step at
a time. Works, and leaves the next person to rediscover the rule.

**(b) Split `translation:drift:check` out of the batch and make it the LAST step in
the job.** A gate that is deliberately red must be last, or it masks whatever
follows. The batch's other ten gates keep their place; the six unmask at once; and
the invariant becomes structural rather than remembered.

I did (a) for the one step my own change touched and stopped there: restructuring
five gates that are not mine is the owner's call, not a side effect of a bean about
`available_locales`.

## Done when

- [ ] Decided between (a) and (b), or a third option, with the reason recorded
- [ ] Every step in the `gates` job can fire while the drift is red — verified by
      reading the job's step order, not by a green run (a green run proves nothing
      here: the drift makes the job red either way)
- [ ] A gate refuses a NEW step registered below a known-red one, or the
      convention is written where somebody adding a step will read it
- [ ] falsified by breaking: registering a step below the red one must be caught
