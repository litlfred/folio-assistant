---
# folio-assistant-7sf1
title: Move MEMORY.md into the kg graph, with correct skill/task pairings
status: todo
type: task
created_at: 2026-09-19T00:04:29Z
updated_at: 2026-09-19T00:04:29Z
---


Queued 2026-09-19 while the `skill-not-a-document` split was in flight; not
started. Requested as: *"move MEMORY.md into kg and make sure in right skill /
task pairings"*.

## What is there now

`.claude/agents/` defines three subagents carrying `memory: project`, each with
a `MEMORY.md` under `.claude/agent-memory/<agent>/`:

- `platform-boundary-guard` — folio-vs-platform boundary, adapter vs profile
- `ci-health-watcher` — whether a workflow actually works on the default branch
- `content-pipeline-navigator` — validate / render / build / qa-sweep

`AGENTS.md` documents them, including the STABLE / TRAP / BASELINE labelling and
the 200-line injection limit.

## Why this is a real gap and not tidying

Agent memory is knowledge-graph content that is **not declared as a node**.
`agent-harness.json` declares `schemas/` and `skills/`; `.claude/agent-memory/`
is committed, read by agents, and outside every declared graph — so nothing
audits it, nothing serves it, and `skill_list` cannot see it. A TRAP recorded in
one agent's memory is invisible to every other agent, which is the opposite of
what a shared knowledge graph is for.

## The pairing question, which is the substantive half

"Right skill / task pairings" is the part that needs judgement rather than a
move. Each memory entry is currently bound to an AGENT. In this repo's model an
agent is closer to an ACTOR, and what an actor knows belongs to the ROLE it
takes on in a lane — per `AGENTS.md`: *"A skill is what the performer needs to
KNOW and belongs to the lane."* So the question is whether a TRAP about the
platform boundary belongs to the `platform-boundary-guard` agent, to a skill
some role carries, or to the task in a process that keeps hitting it.

## Done when

- `.claude/agent-memory/` content is reachable from the declared `kg` graph,
  or the harness declares it as its own graph kind with a schema.
- Each memory entry is paired with the skill or task it actually informs,
  rather than with the agent that happened to record it.
- `AGENTS.md`'s description matches wherever it ends up.

## Open before starting

Whether memory becomes a new graph kind (like `bean-defs`, `workflow-state`) or
is folded into existing skill bodies. The first keeps the STABLE/TRAP/BASELINE
distinction, which is load-bearing: a BASELINE is a measurement that goes stale
by design and must never read as a current answer.
