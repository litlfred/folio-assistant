---
# folio-assistant-129h
title: 'Merge refused: #2080 owed CI not green on its head'
status: todo
type: bug
created_at: 2026-10-04T14:30:42Z
updated_at: 2026-10-04T14:30:42Z
parent: folio-assistant-3fva
blocking:
    - folio-assistant-5hox
---

PR #2080, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict declared, own CI missing-required.
- Queue entry (`beans/queue/litlfred--folio-assistant--2080.json`, status `waiting-on-author`): Owner-approved; CI red on its head, conflicts with main (declared). (Previously: ACK: in the queue with owner approval (2026-10-04, "approve all 6"). Handed back: its own CI is red on its head.)


## Roles
- Fix: whoever holds #2080: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
No takeover plan was written; the PR comments carry its state.

## Report to
A comment on PR #2080, plus a message to the Merge Manager role.

## Done when
- [ ] #2080 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2080` passes all 7 checks, and it lands (or the owner closes it)
