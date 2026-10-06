---
# folio-assistant-58ro
title: 'Merge refused: #1977 owed CI not green on its head'
status: completed
type: bug
created_at: 2026-10-04T14:30:42Z
updated_at: 2026-10-06T19:30:00Z
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
- [x] #1977 merges main cleanly (merge commit; `git submodule update --init` before staging; no dropped `*/test/results/*` files)
- [x] the owed `pull_request` CI is green on that head
- [x] the body names the owning session; `ready-to-merge` label; signed `ready: <head sha>`
- [x] `bun run merge:guard 1977` passes all 7 checks, and it lands (or the owner closes it)

_2026-10-06T19:03:39Z_ — Claimed by claude/sep-bookkeeping-s1-s3 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Closed 2026-10-06 by claude/sep-bookkeeping-s1-s3. The refusal this bean records was resolved: **#1977 merged 2026-10-05T02** (merged_by litlfred, label `ready-to-merge`).

Evidence, re-read from GitHub on 2026-10-06 rather than taken from a note:
- The PR's base at merge time was main, and GitHub merged it, so it merged cleanly. The body names the owning session (session_01BccmnVFbtRpKxM39kyVw9q, a takeover recorded in the body).
- Every gate check run on head `04:18Z:d5f2a6b` concluded **success**: Repository gates (hard), registered-never-run-elsewhere (hard), Skill-registration chain (hard), TypeScript lint/types/tests (hard, bun test shards 1–4), End-to-end + accessibility (hard, shards 1–3), Import hygiene, .jsonld siblings. **merge-guard (evaluate): success.** Other merge-guard runs on the same head were *cancelled* duplicates, not failures.
- No check on the head concluded failure.
