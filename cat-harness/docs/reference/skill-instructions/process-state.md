---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Process state'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/process-state.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/process-state.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/process-state.md){: .fa-edit-source }

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
| **swimlane / role** | am I the actor who may do this? | the lane on the activity; checked by the executor ([`task-authorization`](../folio-core/task-authorization.md)) |
| **task** | which step am I on, and is it enabled? | `workflow_next` |

`workflow_next` reports what is enabled **now**, which lane owns it, and which
skill implements it. `workflow_complete` refuses a step that is not enabled.
Those two are the ground truth; your memory of where you were is not.

**Name yourself when you complete a step.** Pass `actor` as a declared actor
id, not a free-text name: `workflow_complete` checks that actor against the
lane's role and the ODRL policies before recording anything, refuses a role
mismatch or a `deny`, and writes the verdict into the history. An `actor` you
type is recorded as **asserted**, not authenticated. Say so rather than
presenting it as identity. `workflow_gate` takes the same `actor` and `target`,
so ask it before doing the work
([`task-authorization`](../folio-core/task-authorization.md)).

## Say which process you are in — every turn

Claiming a work item says *what* you are working on. This says **where in the
process** you are working, which is the question a reader cannot answer from an
id.

**Name the process, the lane and the task**, and say when you switch:

> **Process:** `crdm-requirements`, Agent lane · **Phase 6 — implement**.
> Completed `A_Implement`; next is `A_Summary`.

**The machinery already answers this**, and the habit is what was missing rather
than the capability: the engine's "what is enabled now" call reports the enabled
step, the lane that owns it, and the skill that implements it — so the answer is
something to act on rather than a bare step name.

**Say which permission you are acting under.** Entering a task in a lane
means performing it as that lane's role, and since issue #1180 that needs an
ODRL rule that permits it there (`permits()` in `schemas/odrl.ts`: the actor,
the action, and the process, task and role as scope). If the answer is
`unknown` or `deny`, you are out of process for that task: route it to a lane
whose actor holds the permission, or stop and ask. The engine enforces this
before the task at the deterministic end of the spectrum; at the agentic end
nothing stops you, and the QA/QC report over the PROV-O record finds it
afterwards (`agentic-harness.html#bpmn-execution`).

**Switching processes is the case that matters.** Moving between processes
changes who is accountable for the next step and which gates apply, and **a
reader who does not know you switched will assume the old lane's rules still
hold.**

### Naming it is not the same as recording it (STRICT)

**Measured 2026-09-20, bean `vlhk`.** 54 proposals merged in one four-hour
window, and `beans/workflows/` — the declared `workflow-state` graph — held
only `.gitkeep`. **Not one session recorded a running instance.** A reviewer
sweeping that window could not classify a single session by lane, which is the
one thing this section exists to make possible. `supn` and `v49e` measured the
same empty directory from other angles.

There were two readings — the processes are not being run, or they are run and
the state is not committed — and they call for opposite remedies. The owner
settled it, 2026-09-20: **the processes are real, and the instance is
recorded.** So:

> **A turn that is in a process has an INSTANCE under the declared
> `workflow-state` graph. Naming the process in prose is the report; the
> committed instance is the evidence, and a report with no evidence behind it
> is what produced 54 merges and an empty directory.**

`workflow_start` creates it, `workflow_next` and `workflow_complete` advance
it, and the state is committed precisely so a sibling session reads the same
position — [`workflow-state.md`](workflow-state.md) §"Why the state is
committed".

**The session-start sweep reports "no instance recorded" as a FINDING, not as
silence.** That is the half that makes the rule self-enforcing: a STRICT rule
whose breach looks exactly like compliance is the `xom7` shape, and it is how
this one went unobserved for 54 merges. A finding is not a failure — plenty of
turns are legitimately outside any process — it is the prompt to say which.

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

## What you MOVED while you were out of process

Steps 1–3 reconstruct **where you were**. They do not reconstruct **what you
changed position of**, and for notes and stickies that is a separate problem
with a sharper edge:

> **A move is not self-documenting.** `moveNote` (`schemas/note-anchor.ts`)
> returns the note with its new anchor and *nothing about the old one*. A note
> that has been moved cannot say where it was.

So a sticky re-anchored during an off-process detour leaves **no trace in the
artefact**. There is no field to read back, no diff that distinguishes "moved
deliberately" from "moved by an agent that had lost the thread", and — because
a move keeps the id — nothing that even looks unusual.

**The only possible record is what was written to a bean at the time.** That is
not a convention this skill is adding; it is the consequence of two decisions
taken elsewhere. Beans carry **no anchor** (owner's rule, 2026-09-19): a bean
is not a thing pinned to a block, it is the record that a pinning *changed*.
And `workflow/bean-link.ts` already has the `note` op that writes it.

So, as part of recovery, before step 3's confirmation:

- **Name every note or sticky you re-anchored during the detour**, with its
  anchor before and after. Read them off the bean's note trail — not off the
  notes, which no longer know.
- **If the trail is silent and you moved things, say that.** A gap is a
  finding. "I moved stickies and did not record where from" is recoverable by
  a person who remembers; "everything is fine" is not.
- **Do not move anything back on your own judgement.** Re-anchoring to undo is
  another unlogged move, and it is a durable change made to cover one — see
  [`deletion-requires-confirmation.md`](../folio-core/deletion-requires-confirmation.md),
  which is the same rule about a different verb.

**Considered and rejected: giving the note its own history.** A `movedFrom`
field would make a move self-documenting and remove the need for any of this.
It was not taken, because the history then lives in the artefact being moved —
so a note deleted, or moved by a tool that does not maintain the field, takes
its own audit trail with it. The bean is a *separate* record, which is what an
audit trail has to be.

### Worked example — reading a bean back as the trail

Bean `5oai`, 2026-09-19, is one, and the episode is an agent's rather than a
sticky's — which is the point: the mechanism does not care what moved.

The bean opened by asserting *"`schemas/todo.ts` carries no block field at
all"*. That was wrong: `TodoNodeSchema` extends `CarriedNoteSchema`, which
declares `targetLabel`, and `test/sticky-todos.e2e.ts` exercises it across two
pages and an orphan label. The agent had grepped the file and not the base it
extends — the second time in that session it asserted an absence without
checking composition.

What makes it a usable trail is that **the wrong claim was left in place**, with
the correction appended beside it rather than replacing it. Read back, the bean
shows the premise, the disproof, and the re-scoped work in order. An agent
resuming can see that the original framing was abandoned *and why*, which is
exactly what it needs to avoid re-deriving the same mistake.

A bean that had been tidied to show only the correct conclusion would read as
though the work had always been aimed there. That is the failure mode
[`bean-coordination.md`](../folio-core/bean-coordination.md) names when it says unwanted work
is `scrapped` **with its reasons** rather than deleted: a record that shows only
outcomes cannot distinguish a dead end somebody ruled out from one nobody tried.

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

The brief you open a turn with ([`turn-reporting.md`](../folio-core/turn-reporting.md))
is what makes detector 5 usable: without a stated plan there is nothing for the
current work to have diverged *from*. The two skills are one loop — brief the
route, notice the divergence, confirm the recovery.
{% endraw %}
