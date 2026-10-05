---
# folio-assistant-ns96
title: 'Merge refused: #2100 not signed (merge:guard checks 3 and 4)'
status: todo
type: bug
created_at: 2026-10-04T14:42:21Z
updated_at: 2026-10-04T14:42:21Z
parent: folio-assistant-nok9
blocking:
    - folio-assistant-uoob
---

PR #2100, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_NotReady: conflict clean, own CI green.
- Queue entry (`beans/queue/litlfred--folio-assistant--2100.json`, status `unknown`): ACK: new at 14:25Z (throttle merge-guard.yml: about 25 runs per 6 min since #2000; closes #2099). Green and conflict-free, but not signed (merge:guard checks 3 and 4). Awaiting the owner's explicit approval.
- No bean named in the PR; parented under the steward epic `nok9`.

## Roles
- Fix: whoever holds #2100: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
No takeover plan was written; the PR comments carry its state.

## Report to
A comment on PR #2100, plus a message to the Merge Manager role.

## Done when
- [ ] #2100 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2100` passes all 7 checks, and it lands (or the owner closes it)
