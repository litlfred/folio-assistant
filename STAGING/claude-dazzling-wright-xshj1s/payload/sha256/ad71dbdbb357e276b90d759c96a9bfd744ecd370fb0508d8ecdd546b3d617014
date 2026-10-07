---
# folio-assistant-87mi
title: 'Merge refused: #2043 owed CI not green on its head'
status: todo
type: bug
created_at: 2026-10-04T14:30:41Z
updated_at: 2026-10-04T14:30:41Z
parent: folio-assistant-1xhc
blocking:
    - folio-assistant-1xhc
---

PR #2043, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict declared, own CI red.
- Queue entry (`beans/queue/litlfred--folio-assistant--2043.json`, status `waiting-on-author`): STATUS UNKNOWN on the 13:40Z all-PR review (open, not in the queue), triaged as: CI red on its head; conflicts with main again (declared paths).


## Roles
- Fix: whoever holds #2043: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
Takeover plan (measured state, ordered steps, owner questions): https://github.com/litlfred/folio-assistant/pull/2043#issuecomment-5980841341

## Report to
A comment on PR #2043, plus a message to the Merge Manager role.

## Done when
- [ ] #2043 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2043` passes all 7 checks, and it lands (or the owner closes it)
