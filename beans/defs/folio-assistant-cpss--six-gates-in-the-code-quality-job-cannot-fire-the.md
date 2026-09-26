---
# folio-assistant-cpss
title: '108 checks in the code-quality job cannot fire: the deliberately-red drift gate is the 3rd of 106 in one `set -e` batch'
status: todo
type: bug
priority: high
created_at: 2026-09-26T18:09:12Z
updated_at: 2026-09-26T18:35:08Z
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


---

## Correction, 2026-09-26 18:40Z: it is not six, it is **one hundred and eight**

This bean counted the **steps** after the failing one. That was the smaller half
of the defect, and I published the smaller number twice — on this bean and in a
comment on #1420, where I wrote that the batch *"runs eleven gates"*. Both were
wrong, and wrong in the direction that makes the problem look survivable.

**The failing step is itself a batch of 106 gates under `set -e`, and the
deliberately-red one is the THIRD.**

Measured on `4c86165bdd`, `.github/workflows/code-quality-gates.yml`:

| fact | line | value |
|---|---|---|
| step `gates that were registered and never run` begins | 928 | — |
| `set -e` | 930 | no `set +e`, no `\|\| true`, no `if`, no `continue-on-error` anywhere in the block |
| `bun run` invocations in the step, all at indent 10 | 931–1418 | **106** |
| `bun run translation:drift:check` | 952 | the **3rd** of the 106 |
| invocations after it, which cannot execute | 955–1418 | **103** |

So the unreachable surface is **103 gates inside the step, plus the 5 whole
steps after it** — 108 checks, not 6. The five steps were only ever the tail of
it.

### Two of the 103 were shipped TODAY, by me, into a place they can never run

- **`check:workflow-injection`** (line 1185) — the `${{ }}`-into-shell scanner
  built and merged today across #1408 and #1415. `grep -rn` over
  `.github/workflows/`: **one** call site, and it is line 1185. The scanner has
  never executed in CI, on any PR or any push to `main`.
- **`check:artefact-verification`** (line 1184) — red on `main` itself until
  `4c86165bdd` declared `translated-links:check`. CI never reported that red and
  cannot report the fix; the repair is verified **locally only** (`exit 0`,
  measured 18:33Z). A sibling session found the same red the same way, by
  running `bun run gates` by hand.

That is the cost stated without an analogy: **a gate merged into this batch is a
gate that does not run, and its author gets a green PR saying otherwise.** The
existing entry's example — a stale `translations.json` hand-fixed after CI went
green — was one gate's worth of that. This is the general case.

### Why the recommendation gets stronger rather than changing

Still the same fix: split `translation:drift:check` out of the batch and make it
the **last step in the job**. The argument no longer rests on the five steps
being valuable, which was arguable — it rests on the batch being the place gates
get registered. `ot9a` wired 106 gates here precisely because they were declared
and run by nowhere, and `no check script is unrun` pushes every new gate into
this step to satisfy it. So the masked region is not a backwater: **it is the
default destination**, and it is downstream of a check that is red by decision.

A second measure worth considering alongside, not instead of: the step's own
name is not a diagnosis. 106 commands under one name means a red tells the
reader nothing about which gate failed, which is why the failing member had to
be identified by running candidates by hand — twice today, by two sessions.

### Provenance

Every number above is from `grep`/`sed` over the committed file at
`4c86165bdd`, counted rather than read off prose, after a control pass for
error suppression and conditionals that found none. The CI side is job
`108460536992` (run `36262379984`): step #45 fails, its log ends at
`translation:drift:check` exit 1, and steps #46–#50 are `skipped`.
