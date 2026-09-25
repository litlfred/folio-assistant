---
layout: default
title: 'Session context'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/workflow/session-context.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/workflow/session-context.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/workflow/session-context.md){: .fa-edit-source }

{% raw %}
# Session context

A **session** is one actor working, from the moment it picks up until it stops.
A **process instance** is a token's position in one diagram. They are not the
same object and the difference is load-bearing:

> A session **starts before** any instance, may open **several**, switches
> between them, and **outlives** each. A session with nothing open is the
> commonest state there is.

Model the session as a field on an instance and the first process opened owns
facts that belong to the actor — and the idle session, which is most of them,
becomes unrepresentable. So it is its own record, **referencing** instances
rather than containing them.

Shape: `schemas/session-context.ts`. Graph kind: `session-state`, layer
`state` — a session writes its own record as it goes, which is exactly what
[`content-context-and-state-graphs`](../folio-core/content-context-and-state-graphs.md)
means by live state.

## The fields — read them off the schema, never off this page

`SessionContextSchema` in `schemas/session-context.ts` is authoritative. This
description said *"the six fields"* until 2026-09-24, by which point there were
**eight** — `waitingOn` and `$schema` had joined `id`, `actor`, `startedAt`,
`updatedAt`, `open`, `claimed`. Bean `s8mo` carried the same "six" and drifted
with it, so the bean and this skill agreed with each other and both disagreed
with the code, which is the one shape comparing them cannot catch.

No count is given here on purpose. A field list in prose beside a Zod object is
a second answer to a question the schema already answers, and it is wrong the
first time somebody adds a field.

## `actor` is required, and it is the point of the record

Every other field can be recovered by looking at the repository. Open
instances are in the bean graph; claimed beans carry their own status;
timestamps can be reconstructed from commits. **WHO is acting cannot be
derived from anything.**

The machine keeping the session cannot infer it — the same reason the Logger
cannot infer who wrote a log line, which is why
[`log-message`](../../../bootstrap/skills/log-message.md) takes `actor` too. A
session record that cannot name its actor records that something is happening
and nothing about **who is answerable for it**, which is the first question a
sibling session needs answered before it touches the same bean.

**It is a reference with a `declared` flag, not an `ActorDefinition`.** An
agent may act without a node under the actors graph, and requiring one would
make the field unfillable in exactly the cold-start case the record is most
useful for. The two facts — *an id that resolves* and *a name nobody declared*
— are kept apart because a consumer acts differently on each: an audit can
follow the first to a role and a permission set, and can only quote the second.

And `declared` is **written, not inferred at read time**. A reader resolving it
themselves gets a different answer than the writer did if the node was added or
removed in between, and the record says what was true when the session acted.

## The rest of the fields, and what each is for

| field | for | notes |
|---|---|---|
| `id` | naming this session | stable for its life |
| `startedAt` / `updatedAt` | telling a live session from an abandoned one | ISO-8601 UTC |
| `open[]` | which instances this session is inside | **empty is normal**, not a gap |
| `claimed[]` | which beans this session announced | by reference, never copied |
| `waitingOn` | why nothing is moving | `what` + `since`, together |

**`open` empty is the normal state.** An agent answering a question, reading, or
deciding what to do next is in no process at all, and
[`process-state`](process-state.md) calls that idle rather than broken. A
record that treated empty as a defect would report every reading session as
one.

**`claimed` is by reference because a claim announces rather than reserves.**
The bean is the authority on its own status
([`bean-coordination`](../folio-core/bean-coordination.md)); a status copied
here would be free to contradict it, and a sibling reading the copy would act
on a claim that had already been released.

**`waitingOn` carries `since` or it carries nothing.** A wait with no start
cannot be told from abandoned work — the same argument
[`bean-blocking`](../folio-core/bean-blocking.md) makes for requiring an
expiry. `what` is free text on purpose: a human answer, a CI run, a sibling's
PR is an open set no enum would survive.

## The session's view of a node is ADVISORY

`open[].atNode` is what the session *believes*. **The instance wins.** The
instance is the authority on its own token; this can be stale by exactly one
step — the gap between a step completing and the session noticing.

It is recorded anyway for two reasons. The commonest question about a session
("what is it doing") should not need a second file read. And a **disagreement**
between the two is itself worth seeing: a session whose view has drifted from
the instance is a session that lost track, which is one of the detectors
[`process-state`](process-state.md) names for being out of process.

## Who reads it, and why it is parsed rather than trusted

**A sibling session**, deciding whether a bean is genuinely being worked or was
claimed by someone who stopped. **A person**, asking what is in flight.
**The session itself** on resume, in a fresh container, where the alternative
is starting a second session beside the one that already exists.

The writer may be an LLM playing the part of a state machine (bean `3nfv`), so
the shape cannot be assumed from the writer's care. `parseSessionContext()`
parses at the boundary, which is what makes a **non-deterministic writer safe
to read from** — and that is the general rule this record is the first case of:
where a machine may be played rather than executed, the schema is the contract
and the parse is where it is enforced.

## What this is NOT

**Not the work plan.** A bean says what is being worked on and survives the
session; this says who is working and where they are right now. Delete every
session record and the plan is intact.

**Not a log.** [`log-message`](../../../bootstrap/skills/log-message.md)
records what an actor DID at a moment, append-only. This is the current
position, overwritten as it moves. A log tells you how you got here; this tells
you where you are.

**Not interaction preferences.** `interaction/interaction.json` holds how a person
wants to be asked — durable, read at session start, never written by a process.
That is `context`, and this is `state`: the two are on opposite sides of the
layer line and must not be merged, however adjacent they look.

**Not a store yet.** The kind is registered and the shape is defined; nothing
writes one. The state machine is bean `3nfv`, and declaring a directory before
anything fills it is the defect where a consumer scans nothing and reports a
clean run.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Session state machine](../../processes/session-state-machine.html) | Establish who is acting; Open the session record; Refresh `updatedAt` only; Write what changed; Close the session |

