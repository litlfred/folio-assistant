---
layout: default
title: Process state
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/process-state.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/process-state.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/process-state.md){: .fa-edit-source }

{% raw %}
# Process state — the task you are in, inside the process you are running

An agent working a BPMN process holds **nested state**: a *task*, inside a
*process instance*, under a *role* that owns a *swimlane*. Losing track of the
outer level while still acting on the inner one is the failure this skill
exists to prevent — it looks like ordinary work and produces changes nobody
authorised.

## The three levels, and what each one answers

| level | answers | where it lives |
|---|---|---|
| **process instance** | which run of which process is this? | `.folio/workflow/`, committed |
| **swimlane / role** | am I the actor who may do this? | the lane on the activity |
| **task** | which step am I on, and is it enabled? | `workflow_next` |

`workflow_next` reports what is enabled **now**, which lane owns it, and which
skill implements it. `workflow_complete` refuses a step that is not enabled.
Those two are the ground truth; your memory of where you were is not.

## How to tell you are out of process

This is the part that makes the skill a procedure rather than an exhortation.
**You are outside the process if any of these is true**, and each is cheap to
check:

1. **`workflow_complete` refused a step you believed was next.** The refusal is
   not an obstacle to route around — it is the detector working.
2. **You are about to change a corpus file and cannot name the instance that
   authorised it.** `scripts/check-corpus-gate.ts` refuses exactly this at the
   commit boundary; discovering it there is late.
3. **`workflow_next` returns a step in a lane whose role you are not playing.**
4. **You cannot say which process instance you are in** without looking it up —
   and looking it up returns nothing, or more than one candidate.
5. **The work you are doing was not in the brief you opened the turn with.** An
   unplanned detour is the most common way this happens, and the least likely
   to be noticed from inside it.

## Recovering

When one of the five fires, **stop making changes** and recover in this order:

1. **Re-read the instance.** `work_plan_prime` reports every instance's
   position next to its bean. State is committed, so a sibling session's
   progress is visible too.
2. **Reconstruct from context what you were doing** and which task it belongs
   to. You usually can: the branch name, the claimed bean, and the opening
   brief together pin it.
3. **Say what you concluded, and confirm it with the user** before resuming:

   > I completed the QA sweep but never completed `Task_ReviewFindings`, so the
   > instance is still sitting before the editor decision. I believe I am in
   > `content-lifecycle` instance `cl-2f9`, in the **editor** lane, at
   > `Gateway_EditorDecision`. Confirm before I proceed?

   **This confirmation is not optional and not a formality.** An agent that
   silently re-enters a process it inferred its way back into is asserting
   authorisation nobody gave it. The whole point of the swimlane guardrail is
   that the actor is *assigned*, not self-declared.
4. **If you cannot reconstruct it, say so and stop.** A wrong instance is worse
   than none: completing a step in the wrong run records an authorisation that
   did not happen.

## What not to do

- **Do not start a fresh instance to escape a confusing one.** Two instances
  for one piece of work is two answers to "was this authorised", free to
  disagree.
- **Do not complete a step to "unstick" the process.** `Task_ReviewFindings`,
  `Gateway_EditorDecision`, `Task_Commit`, `Task_AuthorizeRelease` and
  `Task_PublishRelease` are marked `relaxable="false"` precisely because they
  are the steps where skipping is most tempting and most costly.
- **Do not treat a refusal as a bug.** `workflow_complete` refusing a step is
  the system telling you your model of where you are is wrong.

## Relationship to the opening brief

The brief you open a turn with (`todo-manager.md` §"Say which bean you are on")
is what makes detector 5 usable: without a stated plan there is nothing for the
current work to have diverged *from*. The two skills are one loop — brief the
route, notice the divergence, confirm the recovery.
{% endraw %}
