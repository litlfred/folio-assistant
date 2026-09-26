---
# folio-assistant-xeer
title: 'ISSUES ARE A THIRD TODO SOURCE: a queryable bean-issue link, and a QA report scoped to beans that OWE one'
status: todo
type: task
created_at: 2026-09-20T17:16:01Z
updated_at: 2026-09-20T17:16:01Z
parent: folio-assistant-8jt6
---

Owner, 2026-09-20, verbatim:

> note, one other source of todos, it is a tool for todos/ in directory, also
> github issues is a set of toods.   add beans to skill to read an issue as a
> bean to track.  skill (request from user permission) to create an issue to
> link untracked beans.   QA report ... is bean in an issue for CRDM, feature
> request type process or content authoritng beans where human adjufication is
> needed.

## The claim: there are THREE todo sources, not two

`beans/` and `todos/` are the two this repository already declares — the agent
work plan and the human one. **GitHub issues are a third**, and they are the
one that carries human adjudication, which is why the QA report below is
scoped to exactly the work where a human must decide.

## Measured 2026-09-20 — the relation EXISTS, as prose

This is a fourth variant of the shape `v1hw`, `supn` and `aazi` share. Those
were widgets over relations nobody had written down. **Here the relation is
written down 33 times, in a form nothing can read.**

- **A bean's front matter has no `issue` field.** Across 234 beans the keys
  are `title`, `status`, `type`, `created_at`, `updated_at`, `parent`,
  `priority`, and `blocked_by` / `blocking` on nine. No issue.
- **33 beans name an issue in their BODY** — `issue #198`, `issues/200` — so a
  third of the linkage that matters is prose.
- **`issue-marks/` already tracks issues**, but for reading position:
  `{issue, lastCommentId, lastUpdatedAt, checkedAt, note}`. And the live
  example's `note` reads *"Queued as bean x3h9"* — **the issue→bean link
  recorded in a free-text field.**

So the QA report the owner asks for cannot be computed today, not because the
facts are missing but because they are unqueryable. That is a better position
than the other three beans are in, and it needs a structured field rather than
a new mechanism.

## The three asks

1. **Read an issue as a bean to track.** A skill that takes an issue and
   creates/updates the bean that tracks it. `issue-marks/` already records how
   far the issue was read, so this composes with an existing store rather than
   inventing one.
2. **Create an issue to link untracked beans — WITH PERMISSION.** The
   permission half is **already a rule**: `crdm-detect` §"Issue association"
   says scan before creating one and **never create one without permission**.
   So this skill does not introduce the constraint; it must obey it, and the
   skill should cite it rather than restate it.
3. **A QA report: is this bean in an issue?** Scoped — *"for CRDM, feature
   request type process or content authoring beans where human adjudication is
   needed"*. Not every bean needs an issue, and a report that said so would
   fire on all 234.

## Why the scoping is the whole design

**A check that fires on every subject is a check that is wrong** — this
repository's own rule, and the reason `2krx` ships advisory. So the report
turns on *which beans owe an issue*, and the owner named the test: work where
**a human must adjudicate**. Two families:

- **CRDM / feature-request** — `crdm-detect` already requires feature work to
  be linked to an issue, so for these the report is enforcing an existing rule
  rather than inventing one.
- **Content-authoring beans needing human adjudication** — the editorial half,
  where an agent must not decide alone.

Neither is derivable from `type:` today (`task`, `epic`, `feature`, `bug`,
`milestone`). **How a bean declares that it owes an issue is the open design
question** — a new `type`, a field, or a tag.

## What to build, in order

1. A structured `issue` field on a bean, and backfill from the 33 prose
   mentions — a one-off migration whose input is greppable.
2. The QA report over beans that owe an issue.
3. The two skills, with ask 2 citing `crdm-detect`'s permission rule.

## Done when

- [ ] A bean can name its issue in front matter, queryable
- [ ] The 33 prose references are migrated, and the migration is checkable
- [ ] A QA report over beans that OWE an issue, scoped so it does not fire on
      all 234
- [ ] A skill to track an issue as a bean, composing with `issue-marks/`
- [ ] A skill to create an issue for untracked beans, citing rather than
      restating the permission rule

## Relates to

`issue-working` (what an issue is FOR against a bean and a PR, and that an
agent never closes one on its own say-so), `crdm-detect` (issue association
and the permission rule), `8jt6` (this epic), and `aazi` — which wants beans
mapped to BPMNs, a second missing edge on the same node.
