---
# folio-assistant-se3i
$schema: bean/1.0.0
title: 'PUBLIC COMMENT: a person can re-route a change set to a different committee by hand'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T11:55:00Z
updated_at: 2026-10-30T12:42:30Z
parent: folio-assistant-rwmf
pr: https://github.com/litlfred/folio-assistant-core/pull/232
---

From [#197](https://github.com/litlfred/folio-assistant/issues/197) — the last open ask on that issue, from @Chine-E on 2026-10-16:

> I need the ability for a human to manually re-route a change set if a human
> decides that the change set should be handled by a different committee.

Everything else #197 asked for landed under epic `q4jm` (beans `xtpc`, `v26p`, `uphx`, `423d`).
Today the committee roll-up is derived; there is no human override.

## Done when

- [x] A person in the editor or committee lane can move a change set to another committee, with a reason.
- [x] The move is recorded (who, when, from, to, why) and survives re-ingest.
- [x] The public-comment dashboard shows the new committee and the move history.
- [x] Agents cannot make the move on their own: it is a person-only step in the Public Comment BPMN.

## Related

@Chine-E's 2026-10-15 question on #197 (mark AUT and GDHP rows 16/30 as duplicates only if verbatim) belongs to the smart-ra comment store, not this bean.

## Progress

- _2026-10-30T12:42:30Z_ — Implemented in [litlfred/folio-assistant-core#232](https://github.com/litlfred/folio-assistant-core/pull/232) (`97514a1`):
  - `schemas/public-comment.ts`: Added `ChangeSetCommitteeMoveSchema` (`who`, `when`, `from`, `to`, `why`, `url?`) and `committee?: TwgGroup` + `committeeMoves` on `ChangeSetSchema`, refining that `committee` matches the latest move's `to`, `why` is non-empty, and `!isAgent(who)`.
  - `scripts/public-comment-routing.ts`: `changeSetRouting(refs, byRef, override)` returns `group: override ?? derived` while keeping `derived` and `counts`.
  - `scripts/public-comment-changesets.ts`: Added `rerouteChangeSet`, `cs-committee: <TWG> — <reason>` on GitHub for committee/editor members, and CLI `reroute <CS-012> --to <TWG> --why "<reason>" --by <login>`, refusing agents and rendering the committee + move history on the change-set's primary issue.
  - `scripts/public-comment-site.ts`: Updated `dashboardHtml` to display the overridden committee (`rerouted`), underlying comment counts, and expandable `move history` (`from → to · who, when — why`).
  - `processes/content/public-comment.bpmn`: Added `<bpmn:userTask id="Task_RerouteChangeSet" name="Re-route a change-set to another committee, with a reason">` in `Lane_Committee` and regenerated `public-comment.checklist.md`, `.pot` files, and extracted glossaries.
