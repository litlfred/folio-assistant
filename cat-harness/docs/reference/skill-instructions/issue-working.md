---
layout: default
title: 'Working an issue'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/issue-working.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/issue-working.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/issue-working.md){: .fa-edit-source }

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
assume completion on its own say-so — the same rule that stops you resolving a
sibling's work item.

After each round of implementation, post a summary on **the issue**, not only on
the change proposal: what was accomplished, what remains, and links to the
updated content for review.
{% endraw %}
