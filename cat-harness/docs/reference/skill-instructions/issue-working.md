---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Working an issue'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/issue-working.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/issue-working.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/issue-working.md){: .fa-edit-source }

{% raw %}
# Working an issue — announce, then re-check

Two rules. Both exist because **your view of an issue and everyone else's
diverge the moment you start**, and neither side can see that it has happened.

## Announce the branch when you create it, not when you finish

Comment on the issue with **the branch name, the process and phase, and the work
items claimed** — at creation.

A summary posted after the work lands is not a substitute. **Until the first
comment appears, a sibling session and a human both see an issue with nobody
visibly on it**, which is precisely the state the work plan exists to prevent
and the one no sibling can detect.

Announce **once**, on the single edge into implementation. A process that loops
back into implement re-enters on the same branch, and re-announcing each time is
noise that trains the reader to skip the announcements that matter.

## Re-check the issue while you work

**Checking once at session start is not checking.** Requirements change while
you are heads-down, and the comment that changes direction is the one you are
least likely to see.

Track what you have already read as **two** marks, not one:

- a **comment-id high-water mark**, and
- the **newest edit timestamp** — because an edited comment keeps its id, and
  **an edited requirement is a changed requirement.** A high-water mark alone
  cannot see an edit at all.

**With no stored mark, everything counts as unseen.** A fresh container has read
nothing, and defaulting the other way is exactly how the comments that change
direction get skipped — silently, because nothing distinguishes *read* from
*never looked*.

Measured here: a session missed **five** owner comments across eighty-four
minutes while working — including the one asking for this rule — and found them
only when the author typed *"new comments"*. Every one of the five changed
direction or added scope.

## When the new material is a large chunk of work, stop

**Do not fold it into the current run.** Say that this is a good stopping point
for review, link the artefact, and confirm priorities before continuing.

The instinct to absorb it is the wrong one twice over: it buries a scope change
inside a diff nobody asked for, and it spends the author's next review on work
they have not agreed to. A large new ask is a decision to hand back, under the
usual discipline — context, options with their costs, a marked recommendation,
then the question.

## What an issue is *for*, against its neighbours

They are not synonymous, and conflating them is how an agent closes something it
had no standing to close:

| | what it carries |
|---|---|
| **issue** | stakeholder sign-off |
| **change proposal** | code review |
| **work item** | work-plan tracking |

**Never close an issue without explicit authorisation from the analyst or
stakeholder.** Whether work is done is a judgement, and an agent must never
assume completion on its own say-so — the same rule that stops you closing a
work item a sibling is mid-flight on.

That authorisation may be given **in advance**: an `issue-close` waiver, which
names the issues it covers and expires. It is the stakeholder answering the
same question earlier, which is the whole of what this rule asks for — never
the agent supplying the judgement itself.
[`confirmation-waiver.md`](confirmation-waiver.md).

After each round of implementation, post a summary on **the issue**, not only on
the change proposal: what was accomplished, what remains, and links to the
updated content for review.

## Before you publish that something does not exist (STRICT)

An issue comment is **published**, and a false claim in one costs more than a
missing true one: it sends the next reader off to verify an accusation, and
the correction never reaches everybody the original did.

So before an issue comment, PR body or commit message asserts that a file, a
function or somebody's cited precedent **does not exist**, re-read it from the
remote — `git show origin/main:<path>` — in a command of its own, and check
the open branches when the claim is *nobody has built this*.

Grepping your checkout answers *"is this in my base"*, not *"does this exist"*,
and a `git fetch` earlier in the same compound command is not a barrier when
siblings merge every few minutes. Both failures happened in one session on
2026-09-21, one of them in a comment accusing a bean of exactly this error:
[`bean-coordination`](bean-coordination.md) §"Re-derive from the REMOTE" has
the measurements and the two guards.

## When the work has a BEAN and no issue (STRICT)

**Measured 2026-09-20, bean `oh78`.** 54 proposals merged in one four-hour
window and **2 issues changed**, both newly opened. Most of that day's work was
bean-driven with no issue at all, so the rule above was not broken — it was
*silently inapplicable*, which is worse, because a rule that quietly does not
apply reads from the outside exactly like a rule being followed.

> **A round summary is owed either way. With no issue, it goes on the change
> proposal AND into the bean — the bean is the durable artefact a sibling
> reads, and a summary that exists only in a PR thread is invisible to the work
> plan on `main`.**

**And a bean that has an issue carries the link BOTH ways.** Issue #558
(*"Sticky pin: unpinning loses the theme"*) has no bean link although bean
`ivfw` is its subject verbatim; issue #464 is open on a completed bean
(`mggs`). One direction is not enough: a reader arriving at either object has
to be able to reach the other, and a check reports the ones that cannot.

When to open an issue at all is [`crdm-detect`](../crdm/crdm-detect.md)
§"Issue association" — **scan before creating one, and never create one without
permission**. This section is about what is owed once the work exists, not
about manufacturing an issue for every bean.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Code change and review](../../processes/code-change-review.html) | Branch, and announce it |
| [Which open pull requests have no CI run on their head?](../../processes/pr-checks-present.html) | Comment ONCE per&#10;(PR, head sha) |

