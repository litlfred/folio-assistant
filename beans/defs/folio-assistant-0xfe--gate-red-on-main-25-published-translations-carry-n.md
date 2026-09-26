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

## Why recording was the right remedy, and not generating catalogues

All 25 were **catalogue** findings. **Zero were structure findings** — measured,
not assumed: `driftFor` runs the structure check independently of the catalogue
check in the same loop, so every page was compared against its source and
`sameStructure` held. Only the `.po` was absent.

`UNCATALOGED`'s own docstring settles it: a catalogue "cannot be derived from a
finished translation without inventing the segmentation". The two
`agent-onboarding` entries already there were precedent for exactly this.

This remains a BACKLOG, not a policy. Every entry on `main` carries a date so
it cannot quietly become permanent, and the translation owner clears them by
adding the catalogues. **That work is still open and is not this bean's.**

## Evidence for closing

Re-derived on `main` at `617609dcd3`, in the real checkout:

| | |
|---|---|
| `translation-drift.test.ts` on `main` | **18 pass / 0 fail** |
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
