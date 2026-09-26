---
# folio-assistant-7sf1
title: Move MEMORY.md into the kg graph, with correct skill/task pairings
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T00:04:29Z
updated_at: 2026-09-19T00:37:53Z
parent: folio-assistant-8jt6
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

---

## CORRECTION — the pairing above is wrong (2026-09-19)

The framing this bean was opened with, and which I then restated to the author
as a 2×2, paired **beans against MEMORY.md** as one mechanism serving two actor
kinds: beans for the human, memory for the agent. The author corrected it:

> todos = human memory, the agents MEMORY.md is agent memory. beans are agent
> workflow management. no human workflow management

**Beans is not the human's side of memory. It is the agent's WORKFLOW
MANAGEMENT**, which is a different axis entirely:

| | memory | workflow management |
|---|---|---|
| **human actor** | todos | *— nothing —* |
| **agent actor** | `MEMORY.md` | beans |

Two consequences worth recording, because both were invisible under the wrong
frame:

**`AGENTS.md` calls beans "the single todo mechanism", and that word is what
misled me.** If todos are human memory and beans is agent workflow management,
then "todo" names beans after a quadrant it does not occupy. Same
coincidence-not-contract drift this repo keeps paying for, in vocabulary rather
than in layout.

**The bottom-left quadrant is EMPTY** — not undeclared, absent. There is no
human workflow management here, and nothing in the repo says so.

## What survives the correction

The role-scoping argument is unaffected: an agent is an ACTOR, memory is
knowledge, and `AGENTS.md` already says knowledge belongs to the lane —
*"A skill is what the performer needs to KNOW and belongs to the lane."* So
binding memory to the agent rather than the role is still the defect.

**Measured 2026-09-19**, `.claude/agent-memory/`: 28 entries across 3 agents,
with **5 subject areas duplicated** between `content-pipeline-navigator` and
`platform-boundary-guard` — two near-verbatim ("the document render path takes
no TeX", and the BASELINE "re-measure, do not quote"). That duplication is
*caused by* agent-scoping: one fact, two files, free to drift.

**A hard constraint on any fix:** `memory: project` is a Claude Code harness
feature that injects `.claude/agent-memory/<agent>/MEMORY.md` into the
subagent's system prompt. The harness decides where it looks, so that file must
stay where it is. Any kg-node model therefore makes it a GENERATED artifact
assembled from scoped entries — the relation `docs/reference/skill-instructions/`
already has to `skills/` — rather than moving it.

## Blocked on

Whether this bean covers the agent-memory quadrant alone, or whether the empty
human-workflow-management quadrant is in scope too. Not started pending that.
