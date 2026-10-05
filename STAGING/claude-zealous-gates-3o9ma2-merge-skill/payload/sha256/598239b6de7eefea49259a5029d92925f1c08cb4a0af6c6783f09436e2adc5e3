---
# folio-assistant-b8de
title: 'Merge refused: #1898 owed CI not green on its head'
status: todo
type: bug
priority: normal
created_at: 2026-10-04T14:30:43Z
updated_at: 2026-10-04T16:41:00Z
parent: folio-assistant-iirv
blocking:
    - folio-assistant-apcg
---

PR #1898, handed back by the Merge Manager on 2026-10-04 (BACKFILLED at 14:50Z: the hand-back was made as a PR comment and a queue entry only, without this bean. Owner: "Backfill + enforce").

## Refused
- `merge:steward` at 14:30Z: Rule_HeadNotGreen: conflict clean, own CI red.
- Queue entry (`beans/queue/litlfred--folio-assistant--1898.json`, status `blocked`): The vqlp HOLD IS LIFTED. The owner chose 'Agent adds the section' (fix, then release). #1898's author fixed it in 03d645180 and closed bean vqlp at 12:19Z; the Merge Manager's agent verified its presenting section, the 'Presented on' link and the unpresented count of 71. Still blocked: (1) an authored placement conflict with #2009 (mlux): document-intake must stay in cat-harness library-core, with main's Task_Citeable kept. The rework is owned by #1898's own session (session_01EKB1gh), handed over by the owner. (2) It conflicts with main, so no gating CI has run on its head. (3) Per its own co


## Roles
- Fix: whoever holds #1898: its author or a takeover session that names itself in the PR body.
- Land: the Merge Manager, through `merge:guard --merge` with the owner's yes.

## Brief
No takeover plan was written; the PR comments carry its state.

## Report to
A comment on PR #1898, plus a message to the Merge Manager role.

## Done when
- [ ] #1898 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [ ] the owed `pull_request` CI is green on that head
- [ ] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [ ] `bun run merge:guard 1898` passes all 7 checks, and it lands (or the owner closes it)


## Attempts
- 2026-10-04 16:40Z, train merge-train-2026-10-04a (PR #2113): EJECTED. #1898 at 0f70ad8 was signed by session_01VfkKoc and its CI guard passed all 7 checks, but merge-base's take-base resolution of the gitignored-but-tracked `cat-harness/test/results/lsi/cat-harness/skills.lsi.json` failed (\"is in the index, but not at stage 2\"). The fault is the tool (class 8j9e), not the PR. It rides the next train once the resolution is fixed or worked around, or after #2066 takes the LSI trio off main.
