---
# folio-assistant-1oqu
title: SCRAPPED typo artefact — duplicate file for 1oqu, content moved to the real bean
status: scrapped
type: task
priority: normal
created_at: 2026-09-20T11:15:44Z
updated_at: 2026-09-20T11:16:41Z
---

## What this file is

**An artefact of a typo, not a bean.** On 2026-09-20 an agent appended a work
record with `cat >>` to a filename one character different from the real bean's
(`…-bibliogr.md` against `…-biblio.md`), which CREATED this file instead of
appending to that one. `beans update folio-assistant-1oqu` then matched this file
and synthesised the front matter above — which is why the title is empty.

**The content was moved to the real bean** and is not duplicated here. Nothing is
lost by this file going.

**Scrapped rather than deleted**, per `deletion-requires-confirmation`: an agent
does not remove a durable artefact on its own initiative, even one it created by
mistake, and `bean-coordination` says unwanted work is scrapped with its reasons
so a sibling can tell abandonment from accident. Removal is the owner's call and
has been put to them.

**Why it is worth removing rather than keeping.** It shares the id
`folio-assistant-1oqu` with the real bean, and two files claiming one id is the
damage the 14,688-duplicate incident actually did — `beans update <id>` becomes
ambiguous. It does not currently fail a gate: `check-bean-parents` only inspects
OPEN beans, and the duplicate-title health check groups by title, which this one
does not share.

**The lesson, and it is the one already written down.** `todo-manager` gained
§"After you create — parent it, and re-run the guard before you push" earlier the
same day, whose point is to READ BACK what you wrote rather than trust a success
line. This is the same failure one step earlier: a shell redirect reports success
whether or not the path was the one intended. Appending to a bean should go
through `beans update --body-append`, which resolves the id, not through a
filename an agent retyped.
