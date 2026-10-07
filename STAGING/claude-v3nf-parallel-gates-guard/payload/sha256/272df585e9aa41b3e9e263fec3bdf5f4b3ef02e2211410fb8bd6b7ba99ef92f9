---
# folio-assistant-0xfe
title: 'GATE RED ON MAIN: 25 published translations carry no `.po` catalogue, compounding across three merges'
status: completed
type: bug
priority: normal
created_at: 2026-09-26T06:44:45Z
updated_at: 2026-09-26T06:47:24Z
parent: folio-assistant-bzyu
---

`translation-drift`'s ratchet test — "no NEW drift, and nothing unreadable" —
was failing on `main`: 25 published translations served with no `.po` catalogue
and no entry in `UNCATALOGED`.

**Fixed on `main` by #1364, not by this bean.** Closed on evidence rather than
authorship, per `bean-coordination` §"Closing a bean whose work has already
landed" — the evidence is re-derived below rather than taken from #1364's word.

## Why it is recorded anyway

Nothing else states WHEN `main` went red or HOW FAR it had drifted. #1364's
account fixes the state; this is the history, and it is the part that says the
gate fired three times and three merges went in past it.

## Measured 2026-09-26 by bisecting `main`'s first-parent history

One test run per merge, on a pristine worktree each time:

| merge | findings |
|---|---|
| `ffe24b51cc` (#1362) | **0 — green** |
| `778fae27e0` (#1368) | 7 |
| `2702e852d0` (#1371) | 17 |
| `a0fbdc7ac7` (#1374) | 25 |

Three translation PRs merged in a row, each publishing pages with no
catalogue, each making the same test worse. **The gate fired on all three and
the merges kept coming** — the same shape as `skill-manifest-coverage` under
#1365, where a working hard gate named six files exactly and nothing acted on
it. That recurrence is the finding worth keeping; the 25 entries were only its
symptom.

A clean 5 x 5 grid: `accessibility`, `content-types`, `contributing`,
`getting-started`, `installation` x `ar`, `es`, `fr`, `ru`, `zh`.

## The owner decided AGAINST recording, and this bean argued the wrong way

**Superseded 2026-09-26 by the owner's decision, which I could not see while
writing the section this replaces.** Recorded here rather than quietly deleted,
because the argument was made confidently and in public (PR #1381) and a reader
who saw it needs to meet the correction in the same place.

The owner chose to ask the `t8g3` campaign for the actual `.po` catalogues
rather than record their absence — bean `ngxj`, 48-hour expiry. Two sibling
sessions carry it verbatim:

> DO NOT add UNCATALOGED entries to go green — documented as a BACKLOG not a
> policy, 2→29 retires a working gate

#1364 merged the 25 entries on the owner's instruction; #1384 reverted them on
the owner's instruction once the collision was shown. `UNCATALOGED` is back to
its original 2 and `main` is **deliberately red** on this gate while the
catalogues are requested via issue #206.

### What I got wrong, precisely

I argued that recording was the correct remedy and that generating catalogues
was not, citing the registry's own docstring — "a catalogue cannot be derived
from a finished translation without inventing the segmentation". That quotation
is accurate and the inference from it was reasonable.

**It was still the wrong move, for a reason the quotation cannot settle.** 2
recorded absences → 27 changes what the gate MEANS: from "published
translations are catalogued" to "we noted that they are not". At that volume
the BACKLOG/policy distinction stops holding, which is the objection the
docstring does not raise about itself. And whether to retire a working gate is
not a question a registry's comment answers — it is the owner's.

The measurement was sound; the remedy was mine to propose and not to decide,
and the PR body asserted it as settled.

## Evidence for closing

Re-derived on `main` at `617609dcd3`, in the real checkout:

| | |
|---|---|
| `translation-drift.test.ts` on `main` @ `617609dcd3` | 18 pass / 0 fail — **no longer true**; see below |
| `main`'s `UNCATALOGED` keys vs the set measured here | **identical** — `diff` empty, 27 entries (2 pre-existing + 25) |
| `check:retired-front-matter`, `check:glossary`, `docs:auto:check`, `check:ci-invocations`, `kg:detangle:check`, `gen-skill-docs --check` | all exit 0 |
| `bun test` on `main` | 11741 pass / 2 fail, and **both failures are a worktree artefact** — `INSTANCE_ROOT is this platform checkout` and `every instance is found` fail only when run from a git worktree at another path; both pass in the real checkout |

## What this cost, recorded because it is the useful part

This was the ninth time in one session that work was duplicated by a sibling,
and the first that checking open PRs first would not have caught: #1364's title
is about beans `k59d` / GOAL 1 / `tuvg` and gives no sign it carries a
`translation-drift` fix. A PR list is searched by subject; a fix riding inside
an unrelated PR is invisible to that search. Recorded rather than filed as a
defect — `c3d7` owns bean-claim stomping, and this is the PR-level analogue it
does not cover.

## Done when

- [x] `main`'s red on `translation-drift` explained, with the commit that
      introduced it and the two that compounded it
- [x] the remedy justified against the alternative, from the registry's own contract
- [x] closed on re-derived evidence rather than on #1364's word
- [ ] the `.po` catalogues themselves added, or the 25 entries re-justified —
      **the translation owner's, tracked under the epic `bzyu`, not here**

## Summary of Changes

No code. The `UNCATALOGED` change this bean was opened to make was landed
independently by #1364 while it was being written, verified byte-identical, so
it was dropped rather than merged as a no-op. What lands is this record.

## Correction, 2026-09-26 07:5x — `main` is red again, by choice

The "Evidence for closing" above was measured at `617609dcd3` and is now stale.
`#1384` (commit `e9f30a78c1`, merged by the owner 07:45) reverted the 25
entries as a pure 161-line deletion, so at `0c5086db6c`:

| | |
|---|---|
| `UNCATALOGED` entries | **2** — back to the original |
| `translation-drift.test.ts` on `main` | **17 pass / 1 fail**, the same 25-finding 5x5 grid |

So my report that "`main` is green" held for roughly forty minutes and is
false now. The gate is red **deliberately**, as the state the owner chose to
sit in while issue #206 is asked for the real catalogues. It is not a defect
and not to be "fixed" by re-adding entries — least of all from this branch.

This bean stays `completed`: what it closes on is the BISECT, which is
unaffected by which remedy was chosen. The 25 findings, the three merges that
compounded them and the gate that fired each time are all still exactly as
measured.

## The cross-session cost, which is the durable finding

#1384 counts this as the sixth duplication in one window and **the first to
reach `main` and need undoing**. For my part it was the ninth in this session,
and this one no amount of checking the PR list would have caught: the decision
lived in bean `ngxj` on no pushed ref, readable only inside two other
sessions' check-in prompts. `tuvg` carries the open item — a way for one
session to see another's open question before the owner answers it, since the
owner cannot be the only place two sessions meet.
