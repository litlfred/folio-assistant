---
# folio-assistant-qml5
title: The stale-claim sweep's 7-day threshold is unreachable — and three things it structurally cannot see
status: todo
type: bug
priority: normal
parent: folio-assistant-ahvw
created_at: 2026-10-02T06:39:03Z
updated_at: 2026-10-02T06:39:03Z
---

Measured 2026-09-22 against `origin/main` @ `937c8d84`, by a dispatched sweep
whose every number was then **re-derived independently** before being written
here.

Filed under `ahvw` rather than under `kpcl`, which owns this subject, because
`kpcl` is a `task` and `check:bean-parents` requires a milestone, epic or
feature — so `kpcl` is the **sibling stream** this belongs to, not the parent
the front matter can name. `ahvw` is `kpcl`'s own parent.

`kpcl` already carries the headline and reached it three hours later from its
own measurement — *"Nothing is older than 7 days, which is the useful half of
the measurement"*. This child carries the parts that measurement does not: why
the 7-day rule **could not have fired**, and the three things it cannot see
whatever its threshold.

## The sweep returned 0 because its threshold is unreachable

| quantity | value |
|---|---|
| in-progress beans on `origin/main` | 100 |
| open PRs scanned (listing complete — page 2 empty) | 22 |
| honoured by an open PR | 18 |
| **stale — no PR and idle ≥ 7 days** | **0** |
| oldest in-progress claim | `7sf1`, **3.52 days** |

Nothing can be 7 days idle because the oldest claim is 3.5 days old, while the
store itself runs back to 2026-06-29. A check that cannot fire is not evidence
of health — it is the `dh4f` shape, a consumer reporting a clean run over what
it was not looking at.

**And the repository already holds a second, tighter threshold for the same
question.** `bun run health`'s `bean-quiet-claims` fires at **72 hours** and
flagged 24 on `origin/main` the same day. Two thresholds for one question are
free to disagree, and the looser one is the one that reports nothing.

## Three things no threshold on `updated_at` can see

- **`updated_at` is a file write, not liveness.** **16 of the 100** have
  `updated_at` identical to `created_at` — never touched since minted. Six of
  those (`bzyu`, `0lmb`, `1swy`, `8jt6`, `ahvw`, `zzmr`) were written in a
  **one-second batch** at 2026-09-19T11:43:43–44Z and are all top-level epics.
  Their recency is a property of the file, not of anybody working. This is
  `fgnw`'s finding, still live after that bean closed.
- **The denominator is `origin/main` only.** A bean living solely on an open
  PR's head is neither counted nor cleared. `cvab` measured the worst case: one
  branch carried an epic and 12 of its 13 children with none on `main`, so a
  main-only review saw 0 % of that workstream.
- **"Honoured" does not mean "being worked".** 7 of the 18 were named only by
  PR #926, a close-and-withdraw sweep — honoured as the *subjects of a batch
  closure*, not as work anybody was carrying. The PR-naming test cannot draw
  that distinction.

## What the sweep could NOT settle

Named rather than folded into the clean count, per the third-state rule:

- The second honouring criterion (an open issue named by the bean, itself open
  and active) was **not evaluated**. Its impact is bounded and computable: it
  can only move a bean *out of* stale, and stale was empty, so it cannot change
  any classification above.
- The open branches' own bean stores were not swept — the gap `cvab` names.

## Done when

- [ ] decide whether two thresholds for one question is intended, or whether
      the 7-day rule goes and `bean-quiet-claims` is the only one
- [ ] decide whether a liveness signal other than `updated_at` is worth having
      — and if not, say so in the skill, so the next sweep does not re-derive
      this
- [ ] decide whether the sweep should read open PR heads' bean stores

Each is a judgement rather than a defect to fix, which is why this is filed and
not implemented. Related: `fgnw`, `cvab`, `zldg` (the block record this sweep
was run to check, landed in #951).
