---
# folio-assistant-lb8h
title: 'Merge refused: #2066 authored conflict with main'
status: todo
type: bug
created_at: 2026-10-04T14:30:42Z
updated_at: 2026-10-04T14:30:42Z
parent: folio-assistant-3fva
blocking:
    - folio-assistant-5hox
---

PR #2066, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_Refused: conflict refused, own CI missing-required.
- Queue entry (`beans/queue/litlfred--folio-assistant--2066.json`, status `waiting-on-author`): STATUS UNKNOWN on the 13:40Z all-PR review (open, not in the queue), triaged as: authored conflict with main; pushed 2h ago.


## Roles
- Fix: whoever holds #2066: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
No takeover plan was written; the PR comments carry its state.

## Report to
A comment on PR #2066, plus a message to the Merge Manager role.

## Done when
- [ ] #2066 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2066` passes all 7 checks, and it lands (or the owner closes it)
