---
name: log-message
description: >
  Say what you are doing, to the Logger, in a form a reader can act on. Five
  required fields and one optional body; an incomplete message is not logged.
  Callable from any task in any process, and required by some.
---

# Logging what you are doing

**You are the author of a log line; the Logger is where it goes.** That is the
whole reason `actor` is an input you supply rather than something the Logger
fills in: it receives, records and decides nothing, so it cannot know who acted.
A line that named the Logger would record that logging happened and nothing
about what did.

It is carried out as a **sub-process**: nobody starts there. A task in another
process calls it, and the calling task's diagram says so; this skill does not
list its callers or the process that implements it (data-modelling, step 8).

## The message

Five strings, all required, and one optional markdown body.

| field | what it answers | shape |
|---|---|---|
| `timestamp` | when | an ISO-8601 instant, e.g. `2026-09-20T14:03:11Z` |
| `actor` | who was acting | the acting actor's id — **never the Logger's** |
| `process` | inside which process | a process id, e.g. `my-process` |
| `task` | at which step of it | a node id within that process, e.g. `A_DoTheThing` |
| `message` | what happened | one line, no newline |
| `body` | the detail, if any | markdown, optional |

**All five are required because each answers a question a reader will otherwise
guess, and a guessed answer in a log is worse than a missing one.** A line
without `task` says something happened somewhere in a process; a reader cannot
tell it from a line about a different step, and the log stops being evidence.

**`body` is the one place free prose belongs.** A diff, an error, the contents
of a file that was not where it should have been. Keep `message` to the line
somebody scanning will read, and put everything else here.

## When to log

**Optionally, from any task in any process.** You need no permission and no
element in the diagram: an actor saying what it is doing is always in order.

**Required where a diagram says so**, which it says by drawing the call
explicitly — a `callActivity` whose `calledElement` is `Process_LogMessage`.
If the diagram drew it, logging is a step, not a courtesy.

The difference between the two is only whether the caller drew it. It is the
same sub-process either way, and it takes the same six fields.

## If you cannot complete the message

**Do not log, and say that you could not.** The `End_NotLogged` branch is a real
outcome, not an error path to route around.

A line missing its `actor` or its `task` still *looks* like a record. A reader
scanning the log cannot tell it from a complete one, so it answers nothing while
occupying the space where an answer would be. Silence is recoverable — somebody
notices a gap. A misleading entry is not.

The same holds if the Logger is unreachable: say so, in the place you would have
logged to, and carry on with the task. **Logging is not a gate.** A failure to
log has never been a reason to abandon an install.

## The one destination bootstrap has

**The discussion with the human actor.** A Bootstrapping Agent has no log file, no
service and no work plan — the only place it can put a line where a person will
see it is the conversation it is already in.

That is the `log-message` Tool: it takes the six fields and writes them into the
chat. `invoke` is `manual`, and honestly so — there is no command; the agent
composes the line and sends it. A harness that installs a real log sink adds a
Tool beside it; this one keeps working, because the skill says what a message
*is* and leaves where it lands to the Tool.

## What this skill is NOT

It is **not** the work plan. A bean says what is being worked on and survives
the session; a log line says what an actor did at a moment and does not claim
to. A Bootstrapping Agent has no beans at all, which is the clearest case: it can log
every step of an install and still have nowhere to record that the install is
outstanding.

It is also not a status report to the Requestor. Logging is not asking. If a
step needs a judgement, that is [`confirm-harness`](confirm-harness.md), and no
number of log lines substitutes for it.
