---
# folio-assistant-e0hw
title: 'Merge refused: #2102 not signed; conflicts with main in generated paths'
status: completed
type: bug
created_at: 2026-10-04T15:07:55Z
updated_at: 2026-10-07T14:55:47Z
parent: folio-assistant-whlc
blocking:
    - folio-assistant-4ak5
---

PR #2102 (two bean notes on 4ak5 and yj6r; no code), opened 15:01Z on 2026-10-04. Handed back on intake by the Merge Manager.

## Refused
- `merge:steward`: Rule_NotReady. Green, but there is no ready marker and no `ready-to-merge` label (merge:guard checks 3 and 4), and it conflicts with main in generated paths only (most likely the regenerated `beans/notes/README.md`).
- Awaiting the owner's explicit approval (it was opened after the last approvals).

## Roles
- Fix: #2102's own session.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Report to
A comment on PR #2102, plus a message to the Merge Manager role.

## Done when
- [x] main merged in (merge commit), `bun run beans:notes` regenerated, pushed by hand
- [x] owed CI green on that head
- [x] `ready-to-merge` label and a signed `ready: <head sha>`
- [x] the owner approves, `merge:guard 2102` passes all 7 checks, and it lands

_2026-10-07T02:38:58Z_ — Claimed by claude/e0hw-close-on-evidence — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Evidence

Closed on evidence of landed work:
- PR #2102 was merged into `main` by `litlfred` in commit `554b9ef86a21` on 2026-10-04T17:37:35Z.
- Re-derived independently on 2026-10-07: PR #2102 state is `MERGED` with commit `554b9ef86a21` present in `main` history.


_2026-10-07T16:55:00Z_ — Closed on owner confirmation and verified evidence of landed work on `main`.
