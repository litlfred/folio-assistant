---
# folio-assistant-yjjt
title: 'BAD HABIT: feature proposals belong on the issue, not in the rendered documentation'
status: completed
type: task
priority: high
created_at: 2026-09-19T10:48:00Z
updated_at: 2026-09-19T10:56:13Z
parent: folio-assistant-t0i3
---

Owner, 2026-09-19:

> also update skills: bad habit, do not do... put feature developemnt/etc
> proposals in the doucmentaiton. the should be attached as comment to
> appporiate issues (for now tooling is github) or in discussion chat.

## The habit, and I am the most recent offender

`docs/.../proposals/` holds **four** files. One of them,
`deployment-topologies.md`, I wrote and merged this session, and I added a
further section to it an hour later. So this is not an old sin being tidied
up — it is a live habit that produced new churn today.

## Why it is wrong, beyond taste

The rendered site is the folio's **published output** and the KG is what
tools read. A design proposal is neither: it is an argument about what to
build, it is superseded the moment it is decided, and it has an audience of
one or two people for about a week. Putting it in `docs/`:

- makes SDLC churn indistinguishable from published content to every
  consumer that walks the graph
- gives it a permanent URL, so it is cited long after it stops being true
- puts it through translation, QA sidecars and link auditing, all of which
  cost something and none of which it needs

An issue comment has exactly the right lifetime and exactly the right
audience, and the tooling is already there.

## What the skill must say

- a design proposal goes on the **issue** it is for, as a comment
- structured content worth keeping goes in **`fsh-guts/`**, which is not
  rendered
- `docs/` is for what a READER of the folio needs, not for how the platform
  decided to build it
- the test: *would somebody who does not work on this platform want to read
  it?* If no, it is not documentation

## The honest exception to write down

Some of what is in those four proposals is not churn — the reasoning that
survives a decision is worth keeping and IS sometimes reference material.
The skill should say where that line falls rather than pretend every
proposal is disposable, or the rule will be ignored the first time it is
inconvenient.

## Done when

- [ ] the rule lives in a skill, reachable from the KG
- [ ] it names issue comments as the destination and `fsh-guts/` as the
      keep-it destination
- [ ] it states the reader test, and the exception above

## Summary of Changes, 2026-09-19

Two skills: `where-a-proposal-goes.md` (the rule, the reader test, and the
exception that keeps it from being ignored) and `fsh-guts.md` (the
destination and the never-delete rule generalised beyond beans).

All four proposals moved out of `docs/`. `docs/folio-assistant/proposals/`
no longer exists.

**What broke, recorded rather than hidden:** the four published URLs are now
404, including links from issues #363 and #223 and a comment I posted an
hour earlier pointing at `deployment-topologies.html`. No redirect: this
Jekyll setup has no `jekyll-redirect-from`, and leaving tombstone pages in
`docs/` would be more of the churn being removed. The affected issues get
a comment pointing at the new location instead.
