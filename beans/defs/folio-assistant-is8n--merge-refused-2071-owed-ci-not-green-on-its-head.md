---
# folio-assistant-is8n
title: 'Merge refused: #2071 owed CI not green on its head'
status: in-progress
type: bug
created_at: 2026-10-04T14:30:42Z
updated_at: 2026-10-07T11:46:10Z
tags: [ready-to-close]
parent: folio-assistant-1xhc
blocking:
    - folio-assistant-1xhc
---

PR #2071, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict declared, own CI red.
- Queue entry (`beans/queue/litlfred--folio-assistant--2071.json`, status `waiting-on-author`): STATUS UNKNOWN on the 13:40Z all-PR review (open, not in the queue), triaged as: CI red on its head; conflicts with main (declared paths).

## Roles
- Fix: whoever holds #2071: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
No takeover plan was written; the PR comments carry its state.

## Report to
A comment on PR #2071, plus a message to the Merge Manager role.

## Done when
- [x] #2071 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [x] the owed `pull_request` CI is green on that head
- [x] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [x] `bun run cat merge:guard 2071` passes all 7 checks, and it lands (or the owner closes it)

_2026-10-07T02:43:54Z_ — Claimed by claude/is8n-close-on-evidence — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Evidence

Closed on evidence of landed work:
- PR #2071 was resolved and merged into `main` by `litlfred` in commit `f2b16b1322a6` on 2026-10-05T12:07:06Z.
- Re-derived independently on 2026-10-07: PR #2071 state is `MERGED` with commit `f2b16b1322a6` present in `main` history.

