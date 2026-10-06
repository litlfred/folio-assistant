---
# folio-assistant-z9hh
title: 'Merge refused: #2093 owed CI not green on its head'
status: in-progress
type: bug
created_at: 2026-10-04T14:30:43Z
updated_at: 2026-10-06T19:04:02Z
parent: folio-assistant-7x5n
blocking:
    - folio-assistant-gz47
---

PR #2093, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict declared, own CI missing-required.
- Queue entry (`beans/queue/litlfred--folio-assistant--2093.json`, status `active`): ACK: Owner-approved 2026-10-04 ~14:00Z ("Approve all 6"). Lands once its owed CI is green and it merges cleanly with main.


## Roles
- Fix: whoever holds #2093: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
Takeover plan (measured state, ordered steps, owner questions): https://github.com/litlfred/folio-assistant/pull/2093#issuecomment-5980859902

## Report to
A comment on PR #2093, plus a message to the Merge Manager role.

## Done when
- [ ] #2093 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 2093` passes all 7 checks, and it lands (or the owner closes it)

_2026-10-06T19:04:02Z_ — Claimed by claude/sep-bookkeeping-s1-s3 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
