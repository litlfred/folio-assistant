---
# folio-assistant-n1fn
title: 'STAGING-REVIEW SIGNATURE: one optional string in, a list of URLs with what to review out'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T16:52:08Z
updated_at: 2026-09-21T16:52:36Z
parent: folio-assistant-ahvw
---


Issue: https://github.com/litlfred/folio-assistant/issues/748 — owner request,
2026-09-21, kept verbatim:

> update skills on discusion during staging deployment... send back to user a
> list of URLs to access in staging (make formal skill) input = string 0,1 user
> request to see staging environment. output = list of urls, markdown exlpaing
> what is in URLs, what to review

## Measured before starting — the skill ALREADY EXISTS, and my first move broke it

`skills/folio-core/staging-review.md` is 288 lines and substantial: the
before/after model, the three observable states, the retention policy, and the
rule that a staging URL is LOOKED UP in the publish ref rather than composed
from a source path.

**I wrote a new skill of the same name over it before checking.** `git status`
reported the file as *modified* rather than *untracked*, which is the only
reason it surfaced within the minute. Restored from `HEAD` and extended.
`deletion-requires-confirmation` is the rule that covers it, and the lesson is
narrower than "read before writing": **an overwrite is a deletion wearing a
write's clothes**, and the check that catches it is asking git what the path
already is, not asking the filesystem whether something is in the way.

## What was actually missing

Not the content — the **signature**. The skill is invoked by the CRDM workflow,
by authoring review sessions, and now by a person typing `/staging-review`, and
each caller re-derives what to pass and what comes back.

## Done when

- [x] input declared: string, cardinality `0,1`, kept verbatim, NARROWS and
      never adds, and an ask matching nothing that changed is said rather than
      answered with the whole preview
- [x] output declared: start-here line, before/after table, what could not be
      checked — every part required, an absent part stated rather than dropped
- [x] the third column carries WHAT TO REVIEW, mapped from changed file to
      published surface, with the interaction named where a change is only
      visible after one (`rptk`: two days behind a tile nobody clicked)
- [x] the third state: a changed page absent from the publish ref is a
      FINDING; a change with no rendered surface is the useful answer
- [x] `/staging-review` exists as a command
- [ ] used once end to end, on a real preview, and the output checked against
      the served tree rather than against the source

## Deliberately NOT added

A second URL-composition rule. The skill already says a URL is looked up in
`gh-pages` and never composed, with the measured failure behind it. Restating
it in the new section would be two statements of one rule, free to drift —
the migration debt `AGENTS.md`'s own banner describes.


## The bean that broke the gate it was opened under

`bun run gates` went red on push 1 with one failure: *"every open bean belongs
to an epic > the real corpus passes"*. **This bean was the orphan** — created
with `beans create "<title>"`, which takes a title and nothing else, so it
landed parentless and went straight to the roadmap's Miscellaneous section.

Parented to `ahvw` (PROCESS: how an agent decides what it does), which is where
a skill about how an agent hands a preview to a reviewer belongs — not `o3xy`,
which is the rendered site's own accessibility, and not `yj32`.

**The failure is a small one with a general shape**: `beans create` is the one
step in this workflow whose output is invisible until a gate reads the whole
corpus. `todo-manager` already carries §"Check before you create" for the
duplicate case; the parent case has the same cause — the CLI's one-argument
form is the convenient one and it produces an incomplete node every time.
