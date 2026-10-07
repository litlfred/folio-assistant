---
# folio-assistant-9gkj
title: 'Merge refused: #2094 owed CI not green on its head'
status: todo
type: bug
created_at: 2026-10-04T14:30:43Z
updated_at: 2026-10-04T14:30:43Z
parent: folio-assistant-1xhc
blocking:
    - folio-assistant-wekz
---

PR #2094, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict declared, own CI missing-required.
- Queue entry (`beans/queue/litlfred--folio-assistant--2094.json`, status `active`): ACK: Owner-approved 2026-10-04 ~14:00Z ("Approve all 6"). Lands once its owed CI is green and it merges cleanly with main.


## Roles
- Fix: whoever holds #2094: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
Takeover plan (measured state, ordered steps, owner questions): https://github.com/litlfred/folio-assistant/pull/2094#issuecomment-5980851089

## Report to
A comment on PR #2094, plus a message to the Merge Manager role.

## Done when
- [ ] #2094 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2094` passes all 7 checks, and it lands (or the owner closes it)
