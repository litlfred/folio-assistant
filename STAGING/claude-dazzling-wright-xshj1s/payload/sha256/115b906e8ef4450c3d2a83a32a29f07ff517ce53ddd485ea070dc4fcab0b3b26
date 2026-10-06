---
# folio-assistant-58ro
title: 'Merge refused: #1977 owed CI not green on its head'
status: todo
type: bug
created_at: 2026-10-04T14:30:42Z
updated_at: 2026-10-04T14:30:42Z
parent: folio-assistant-7x5n
blocking:
    - folio-assistant-7x5n
---

PR #1977, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict declared, own CI missing-required.
- Queue entry (`beans/queue/litlfred--folio-assistant--1977.json`, status `active`): STATUS UNKNOWN on the 13:40Z all-PR review (open, not in the queue), triaged as: pushed this hour; CI red on its head.


## Roles
- Fix: whoever holds #1977: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
Takeover plan (measured state, ordered steps, owner questions): https://github.com/litlfred/folio-assistant/pull/1977#issuecomment-5980855545

## Report to
A comment on PR #1977, plus a message to the Merge Manager role.

## Done when
- [ ] #1977 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 1977` passes all 7 checks, and it lands (or the owner closes it)
