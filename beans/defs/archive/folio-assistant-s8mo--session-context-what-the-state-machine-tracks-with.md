---
# folio-assistant-s8mo
title: 'SESSION CONTEXT: what the state machine tracks, with actor required'
status: completed
type: task
priority: normal
created_at: 2026-09-20T05:04:19Z
updated_at: 2026-09-20T06:47:01Z
parent: folio-assistant-ahvw
---

Owner, 2026-09-20:

> the state machine (which could being played by the agent) should be keeping
> track of session context including the actor is a required input

## Measured before designing: no session store exists, and one file looked like it

`.harness/interaction.json` is the only session-adjacent file, and it is NOT
this: it holds a person's interaction PREFERENCES — durable, read at session
start, never written by a process. By the axis `mhh9` settled that is
`context`; a session record is `state`. Opposite sides of the layer line, and
merging them would have been the two-answers defect wearing a plausible name.

**Noted in passing, not fixed here:** `.harness/` is declared by no
`harness.json`. Committed graph content no declaration mentions is the `dh4f`
defect in reverse, and it is bean `glwk`.

## The line this record exists to draw

`workflow-state` is where ONE INSTANCE got to. A session SPANS processes — it
starts before any instance, may open several, switches between them, and
outlives each. Model it as a field on an instance and the first process opened
owns facts belonging to the actor, while **the idle session — the commonest
state there is — becomes unrepresentable.**

## Why `actor` is required and nothing else is

Every other field can be recovered by looking at the repository: open instances
are in the bean graph, claimed beans carry their own status, timestamps are
reconstructible from commits. WHO is acting cannot be derived from anything.
The machine keeping the session cannot infer it, the same way the Logger cannot
infer who wrote a log line — which is why `log-message` takes `actor` too.

It is `ActorRef` (`id` + `declared`), not an `ActorDefinition`: an agent may act
with no node under the actors graph, and requiring one would make the field
unfillable in exactly the cold-start case the record is most useful for.
`declared` is WRITTEN rather than inferred at read time, because a reader
resolving it themselves gets a different answer if the node moved in between.

## Summary of Changes

- `schemas/session-context.ts` — zod, authoritative. Six fields **when this
  was written; eight on 2026-09-24** (`$schema`, `id`, `actor`, `startedAt`,
  `updatedAt`, `open`, `claimed`, `waitingOn`). The count is not re-synced
  here because it should never have been written down: read the schema.
  `session-context.md` carried the same "six" and drifted with it, so bean and
  skill agreed and both were wrong — which no comparison between the two can
  detect.
  `parseSessionContext()` parses at the boundary, and that is the general rule
  this record is the first case of: **where a machine may be PLAYED rather
  than executed, the schema is the contract and the parse is where it is
  enforced.**
- `session-state` graph kind: `holds: "state"`, naming its `skill` and its
  `schema`. Registered ahead of a directory — `memory` and `folio`, not
  `dh4f`, because nothing scans a kind.
- `skills/workflow/session-context.md` — the six fields and what each is for,
  why `open: []` is normal, why `claimed` is by reference (a claim announces
  rather than reserves, so a copied status could contradict the bean), why
  `waitingOn` carries `since` or nothing, and why `atNode` is ADVISORY with
  the instance winning — plus why a disagreement between the two is itself
  worth seeing.
- Eight tests, each pinning a refusal rather than a shape: a missing `actor`,
  an omitted `declared`, a `waitingOn` without `since`, a wrong `$schema` tag.
  Written now rather than with the writer, because a schema nobody has
  exercised is a schema whose constraints are a hope.
- Avatar and the `directory-conventions` table row, both of which the gates
  demanded — the same two that `memory` needed.

## NOT a store

Nothing writes a session record. The state machine is `3nfv`, and declaring a
directory before anything fills it is the defect where a consumer scans nothing
and reports a clean run.

## Done when

- [x] the record's shape is authoritative and parsed at the boundary
- [x] `actor` required, with declared/undeclared distinguishable
- [x] the kind registered, naming its reader and its shape
- [x] a skill saying what each field is for and what the record is NOT
- [x] 43 gates pass
