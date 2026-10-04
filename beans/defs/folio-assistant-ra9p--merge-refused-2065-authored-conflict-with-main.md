---
# folio-assistant-ra9p
title: 'Merge refused: #2065 authored conflict with main'
status: todo
type: bug
created_at: 2026-10-04T14:30:41Z
updated_at: 2026-10-04T14:30:41Z
parent: folio-assistant-hfag
blocking:
    - folio-assistant-30jr
---

PR #2065, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_Refused: conflict refused, own CI missing-required.
- Queue entry (`beans/queue/litlfred--folio-assistant--2065.json`, status `waiting-on-author`): STATUS UNKNOWN on the 13:40Z all-PR review (open, not in the queue), triaged as: authored conflicts in check-declared-dirs.ts and subgraph-readmes.ts, quoted on the PR. No push for 4h. The decision-record draft (zmdo) builds on it.


## Roles
- Fix: whoever holds #2065: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
No takeover plan was written; the PR comments carry its state.

## Report to
A comment on PR #2065, plus a message to the Merge Manager role.

## Done when
- [ ] #2065 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2065` passes all 7 checks, and it lands (or the owner closes it)
