---
# folio-assistant-29ij
title: CI watchers are mechanical roles in the CI process, with two dispatch points
status: completed
type: task
priority: normal
created_at: 2026-09-19T05:24:55Z
updated_at: 2026-09-19T08:54:16Z
---


## The correction

Stated by the owner, 2026-09-19:

> ci watchers are agents/mechanical roles that are part of the CI process.
> that should kick off during feature development once changes are made to
> feature branch. and when approved for final publication/merge to main

This **corrects a claim I made in `h32d` and in PR #314's body**: that none of
the 30 declared roles fits `ci-health-watcher`, so mapping it would force a
wrong edge. That was wrong, and checkable in one command — `roles.json`
already carries two `actorKind: "system"` roles for exactly this:

- **`build-pipeline`** — *"Validates, renders and publishes. A system lane: it
  runs a fixed program and exercises no judgement, so anything needing a
  decision belongs in a different lane."*
- **`validation-pipeline`** — *"The mechanical half of the HCI validation gate.
  Its findings are inputs to the editor's decision, never the decision."*

And `.claude/skills/actors/ci-pipeline.json` already **takes both**. So the
lane a CI watcher acts in is declared, the actor kind is declared, and the
"inventing a role to absorb a tool" objection does not apply to this one.

What I got right and should keep: a watcher exercises **no judgement**. Both
role descriptions say so explicitly, which is what makes them the correct
home rather than a convenient one.

## The new requirement — two dispatch points

The owner did not only place the role; they said **when it fires**:

1. **During feature development**, once changes are made to a feature branch.
2. **When approved for final publication / merge to `main`.**

That is the *trigger* half of the memory spec, which until now had no concrete
instance. From the original statement of it:

> generic memory workflows regardless of actor triggered by "this is something
> new/you havent seen in a while" or maybe a actor specific trigger like "I
> want to dispatch agent with a specific memory context for a narrow task"

A CI watcher dispatched on a feature-branch push, with CI-scoped memory, is
precisely "dispatch agent with a specific memory context for a narrow task" —
the actor-specific trigger, made concrete.

## What this changes in work already merged or in flight

- **Do NOT delete `memoryForRoles`.** PR #314's option was to remove it as
  dead code with an argument attached. It has a real consumer now: a watcher
  acting as `build-pipeline` / `validation-pipeline` should be handed that
  lane's memory, not a file named after the agent.
- **`AGENTS.md` and `schemas/memory.ts` both currently say the three
  memory-carrying subagents "are not declared actors at all" and that choosing
  their roles is "not something to guess".** True as a fact about
  `.claude/skills/actors/`, and misleading as a conclusion for
  `ci-health-watcher`. Both need correcting.
- The other two (`content-pipeline-navigator`, `platform-boundary-guard`) are
  **not** settled by this. A boundary guard exercises judgement, which is the
  one thing the system lanes exclude.

## Done when

A CI watcher is dispatched by the process rather than by a person remembering
to ask for it. Concretely, and each part is separable:

1. **Declare the actors.** `ci-health-watcher` as a `system` actor taking
   `build-pipeline` and `validation-pipeline`. Smallest step, unblocks
   `memoryForRoles`, and is independently correct.
2. **Place the two dispatch points in a diagram.** They are process events, so
   they belong in BPMN under `processes/`, not in prose here. The likely
   homes are `draft-to-publication` (the merge-to-main gate) and a
   feature-branch process that may not exist yet — that needs checking, not
   assuming.
3. **Decide what "kick off" means mechanically.** A GitHub Actions job, an
   activity a session performs, or an MCP tool a workflow step calls. Not
   guessable from the statement, and the three have very different costs.

Part 1 is safe to do now. Parts 2 and 3 want the owner's steer, and part 3 is
feature work — so it enters CRDM and needs an issue rather than being built.

## Not doing now

Queued rather than pivoted to, per the owner's standing instruction: *"in
chats if I discuss a new task I want you to queue/run in parallel, do not pivot
unless explicitly told so."* The chosen next task is designing the human todo
store.

_2026-09-19T08:39:19Z_ — Not claiming this bean — it is about the CI-HEALTH watcher's two dispatch points (feature-branch change, and approval for merge to main), and I have not drawn those.

What I did do, on branch `claude/pin-theme-upstream-watch` (PR #362, bean `1rlj`), is apply this bean's RULE to a different watcher, so there is now a worked instance of it to copy from: `processes/upstream-pin-watch.bpmn` puts an upstream-pin watcher's dispatch point in a diagram rather than in prose. It uses exactly the placement 29ij argues for — every mechanical step sits in the `CI/CD Pipeline` lane, which binds `build-pipeline` (`actorKind: system`, 'runs a fixed program and exercises no judgement'), and no role was invented. The one step that needs judgement is a `callActivity` out to a separate process whose accepting step is a `bpmn:userTask` in a person-only lane.

The specific thing that transfers: the three-state discipline. `current` / `behind` / `unknown`, with `unknown` never rendered as green and the job failed — which is `check-ci-health.ts`'s own rule, drawn as a gateway and an end event rather than left in the script.

Leaving 29ij open and unclaimed.

_2026-09-19T08:52:50Z_ — Built both dispatch points as activities in content-change-review.bpmn's CI/CD Pipeline lane, per the owner: a dispatch point is a task/workflow initiation that opens a bean, not a workflow_dispatch.

Task_WatchBranchCI (after Task_CommentPR) carries op=claim — the branch changed and a staging build exists to watch; claim is idempotent, so re-entering on a later push does not duplicate it.

Task_WatchMainCI (after Task_RebuildMain) carries op=note — the bean already exists by then, and whether the publish SUCCEEDED is the judgement this lane must not make. That is bean xom7 exactly: docs-site.yml failed 30 times while reporting its own exit code.

build-pipeline gained 'watch' and 'todo-manager'. The audit demanded it (role-carries-activity-skill, 4 findings) and it is consistent with the role's own description — claim and note are fixed programs; resolve would be judgement, and is deliberately not used.

Measured: skill-in-role-or-process 101 -> 100. 'watch' was previously reached, if at all, by direct invocation.
