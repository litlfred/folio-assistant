---
# folio-assistant-2ee5
title: 'Merge refused: #1955 handed back'
status: todo
type: bug
created_at: 2026-10-04T14:30:43Z
updated_at: 2026-10-04T14:30:43Z
parent: folio-assistant-whlc
blocking:
    - folio-assistant-4ak5
---

PR #1955, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_MvpHighRisk: conflict declared, own CI green.
- Queue entry (`beans/queue/litlfred--folio-assistant--1955.json`, status `active`): STATUS UNKNOWN on the 13:40Z all-PR review (open, not in the queue), triaged as: author active this hour; conflicts with main in generated paths only, so it waits on a merge of main and the code-quality-gates run.


## Roles
- Fix: whoever holds #1955: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
Takeover plan (measured state, ordered steps, owner questions): https://github.com/litlfred/folio-assistant/pull/1955#issuecomment-5980832806

## Report to
A comment on PR #1955, plus a message to the Merge Manager role.

## Done when
- [ ] #1955 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 1955` passes all 7 checks, and it lands (or the owner closes it)
