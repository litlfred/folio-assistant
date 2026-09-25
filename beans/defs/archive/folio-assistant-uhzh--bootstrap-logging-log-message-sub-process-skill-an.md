---
# folio-assistant-uhzh
title: 'BOOTSTRAP LOGGING: log-message sub-process, skill and Tool an Initiator can reach'
status: completed
type: task
priority: high
created_at: 2026-09-20T04:29:39Z
updated_at: 2026-09-20T14:37:12Z
parent: folio-assistant-8jt6
---

Owner, 2026-09-20:

> there is another Machine which is Logger and sub-process 'log-message' to add
> 'logging'. skill is to log what you are doing as an Actor (Human or Agent)
> with the Logger. input=required strings (timestamp,actor,process,task,log
> message), 1 optional markdown. A log-message process may be initiated
> optionally during any task in a process. A bpmn may also explicitly require a
> log message and indicate doing so by instiating the log-message subprocess.
> add one tool for log-message which is to send the log message to the
> dicussion chat with the human actor

and, the same session:

> two bpmns allowed, one is used as (independent) sub-process

> also failure mode on initialize a repo... it has already been initalized, log
> message

## The BOOTSTRAP half of `7uff`, not a second answer to it

`7uff` is logging under cat-harness: entries in `fsh-guts/logs/`, off by
default, emptied by an actor. That store is harness machinery, and an Initiator
has none of it — no work plan, no server, no `fsh-guts/`. Defining logging
upstream would leave the actor with the most need to say what it is doing and
the least machinery to do it with unable to log at all.

So `log-message` lives in `bootstrap/` and everything downstream inherits it.
The two meet at the skill: `7uff`'s file store is another Tool beside
`log-message`, satisfying the same skill. Nothing here forecloses it.

## What one process you START turned out to mean

The earlier instruction was a SINGLE AND ONLY bpmn. A sub-process callable
"during any task in any process" cannot be embedded inside `initialize-harness`
— embedding makes it reachable only from there. The owner settled it: two
diagrams, one of them an independent sub-process. The constraint was never one
file; it is that there is **one place to start**, and a sub-process does not
compete for it.

## Done when

- [x] `logger` role — `system`, `actedUpon`, no skills. The Logger is where the
      line goes, not its author, which is why `actor` is a required input.
- [x] `bootstrap/workflows/log-message.bpmn` — two lanes, `GW_Complete`, and an
      `End_NotLogged` that is a real outcome.
- [x] `bootstrap/skills/log-message.md` — the six fields, optional vs required
      calling, and why an incomplete line is not logged.
- [x] One Tool: the discussion with the human actor, `invoke: manual`.
- [x] `initialize-harness` calls it at both points where logging is a step.
- [x] The already-initialized failure mode.


## 2026-09-20 — closed on re-measurement (`0pes`)

All six Done-when boxes were ticked and the bean was still open. Verified each
independently rather than trusting the boxes:

| item | measured |
|---|---|
| `logger` role | `bootstrap/scenarios/roles.json` — `actorKinds: ["system"]`, `skills: []`, `actedUpon` in its description |
| the sub-process | `bootstrap/workflows/log-message.bpmn` — `Lane_Actor`, `Lane_Logger`, `GW_Complete`, `End_NotLogged` |
| the skill | `bootstrap/skills/log-message.md` |
| one Tool, manual | `cat-harness/tools/index.ts:1093` — `invoke: { manual: true }`, `install: { none: true }`, five required fields + optional `body: Markdown`, `satisfies: ["log-message"]` |
| called at both logging steps | `initialize-harness.bpmn` — `A_LogInstallStart` and `A_LogFailure`, both `callActivity` → `Process_LogMessage` |
| the already-initialized failure mode | `GW_AlreadyInitialized`, with the three logged ways in documented |

This one carried no *"not my bean"* note — it was simply finished and left open,
which is the same end state the six reached by a different route.
