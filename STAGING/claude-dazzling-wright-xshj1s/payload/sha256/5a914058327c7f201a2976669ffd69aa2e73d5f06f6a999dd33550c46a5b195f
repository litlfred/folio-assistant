---
# folio-assistant-5ki9
title: 'Merge refused: #2082 owed CI not green on its head'
status: todo
type: bug
created_at: 2026-10-04T14:42:21Z
updated_at: 2026-10-04T14:42:21Z
parent: folio-assistant-qvxh
blocking:
    - folio-assistant-70zt
---

PR #2082, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict clean, own CI red.
- Queue entry (`beans/queue/litlfred--folio-assistant--2082.json`, status `active`): Owner-approved 2026-10-04 ~14:00Z ("Approve all 6"). Re-approved WITH its new scope (--chrome-owner by path, lbz8). Lands once green and conflict-free. (Previously: APPROVAL VOID: approved 13:00Z as a bean-close PR ('Beans: close 70zt, izx8, qvxh'). Its branch has since become an 11-file code change ('n3ni stage E support: --chrome-owner by path', lbz8 commits from 13:16Z). Re-approval needed. (Previously: ACK: in the queue with owner approval (2026-10-04, "app)


## Roles
- Fix: whoever holds #2082: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
No takeover plan was written; the PR comments carry its state.

## Report to
A comment on PR #2082, plus a message to the Merge Manager role.

## Done when
- [ ] #2082 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2082` passes all 7 checks, and it lands (or the owner closes it)
