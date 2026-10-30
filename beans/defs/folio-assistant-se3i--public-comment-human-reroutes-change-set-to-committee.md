---
# folio-assistant-se3i
$schema: bean/1.0.0
title: 'PUBLIC COMMENT: a person can re-route a change set to a different committee by hand'
status: todo
type: task
priority: normal
created_at: 2026-10-30T11:55:00Z
updated_at: 2026-10-30T11:55:00Z
parent: folio-assistant-rwmf
---

From [#197](https://github.com/litlfred/folio-assistant/issues/197) — the last open ask on that issue, from @Chine-E on 2026-10-16:

> I need the ability for a human to manually re-route a change set if a human
> decides that the change set should be handled by a different committee.

Everything else #197 asked for landed under epic `q4jm` (beans `xtpc`, `v26p`, `uphx`, `423d`).
Today the committee roll-up is derived; there is no human override.

## Done when

- [ ] A person in the editor or committee lane can move a change set to another committee, with a reason.
- [ ] The move is recorded (who, when, from, to, why) and survives re-ingest.
- [ ] The public-comment dashboard shows the new committee and the move history.
- [ ] Agents cannot make the move on their own: it is a person-only step in the Public Comment BPMN.

## Related

@Chine-E's 2026-10-15 question on #197 (mark AUT and GDHP rows 16/30 as duplicates only if verbatim) belongs to the smart-ra comment store, not this bean.
