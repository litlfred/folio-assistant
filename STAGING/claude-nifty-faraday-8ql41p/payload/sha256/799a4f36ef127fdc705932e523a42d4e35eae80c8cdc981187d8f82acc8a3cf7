---
# folio-assistant-obhe
title: merge-main's notification rule has no skill home — ci-health.md carries the doctrine and names only one instance
status: todo
type: task
priority: normal
created_at: 2026-10-04T06:09:01Z
updated_at: 2026-10-04T06:09:01Z
parent: folio-assistant-1xhc
---

Spun out of `03nl` (PR #2046) rather than widened into it.

## What is already true

`skills/sdlc/sdlc-core/ci-health.md` §"A report is only read by someone in the
room" ALREADY carries the doctrine this change is an instance of: one tracking
issue **edited in place**, because *"an edit does not notify, so a long outage
stays one unread item rather than a stream"*, and *"it deliberately does not
send another email. The platform already sent 30 and the premise of the whole
exercise is that nobody reads them."*

`03nl` applies exactly that to `merge-main.yml`: the bot's in-place PR comment
is the record, the red run is the notification, and a failure whose signature
the comment already holds does not notify again. Same rule, second mechanism —
and the skill names only the first.

## Why it was not done in that PR

Editing a skill `.md` pulls in the registration chain (`skill:register`,
`skills:docs:check`, the LSI index, detangle measurements, kg-qa prose
attestations). Those generated artefacts are the most conflict-prone files in
the repository — #1952's diff shows a 1570-line `skills.lsi.json` churn — and
#2046 is a notification fix that should land small and fast, on a workflow the
merge manager has to order against #1952 anyway.

## Done when

- [ ] `ci-health.md` names the merge-main comment as the second instance of the
      edited-in-place rule, with the three conditions that stay loud (new,
      changed cause, systemic) and the four records a quiet failure keeps
- [ ] `bun run skill:register` run, every derived artefact current
- [ ] nothing restated that the workflow's own comments or
      `merge-main-comment.ts`'s docblock already carry — the skill wins, the
      code points at it
