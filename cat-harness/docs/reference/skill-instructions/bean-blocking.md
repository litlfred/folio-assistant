---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Blocking is a claim about the work, not a mood'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/bean-blocking.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/bean-blocking.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/bean-blocking.md){: .fa-edit-source }

{% raw %}
# Blocking is a claim about the work, not a mood

`blocked` is the most expensive status a bean can carry, because a blocked bean
**stops being work anyone can pick up** — and unlike a failure, nothing ever
tells you it went stale.

## Default to non-blocking

Before setting `blocked`, ask whether the work is genuinely stopped or merely
*awkward*. These are **not** blocking:

- **Waiting on CI.** End the turn; the result wakes you.
- **Waiting on review.** The PR is the artefact; other work continues.
- **Waiting on a decision you have not yet asked for.** Ask, then continue on
  the parts that do not depend on the answer.
- **Part of the task is unclear.** Do everything that does not depend on the
  unclear part, and state the assumption for the rest.
- **You would rather do something else first.** That is ordering, not blocking.

The test: **is there any remaining work on this bean that could proceed right
now?** If yes, it is not blocked — it is in progress with a question attached.

## When it really is blocked, say four things

A bare `blocked` tells the next agent nothing except not to bother. Carry:

| field | why |
|---|---|
| **what it waits on** | so a reader can tell whether the thing has since happened |
| **since** | so staleness is visible |
| **expires** | a timeout, after which the block is presumed stale |
| **handoff** | what a *different* agent should do on picking it up |

### Write it as a `## Blocked on` section — NOT as a status

```markdown
## Blocked on

- **waits on:** the Tools-schema carrier decision (#223)
- **since:** 2026-09-18T17:20Z
- **expires:** 2026-09-20T17:20Z
- **handoff:** if no answer by then, proceed with the JSON-LD carrier as
  recommended and note the assumption in the PR body.
```

The bean's `status` stays `in-progress`. **`status: blocked` does not exist**,
and this skill told agents to write it until 2026-09-22 — which is why the
record below was never created even once.

> | source | accepts |
> |---|---|
> | `beans update --help` | *"in-progress, todo, draft, completed, scrapped"* |
> | `schemas/tool-types.ts` | the same five — *"Exactly what `beans update --status` accepts"* |
>
> Measured across the 99 in-progress beans on `main` that day: **0** carried
> `expires`, **0** carried `status: blocked` (it does not parse), 4 asserted a
> block in a structured way and 26 more only in prose. A prescribed form the
> tool refuses is not a strict rule — it is a rule with a **0 % compliance
> ceiling**, and every one of those 26 blocks fell back to prose that no date
> can expire. Bean `zldg`.

**`expires` is an ABSOLUTE timestamp, not `+48h`.** A relative offset has to be
read against `since` by whoever finds it, which means a stale block stays
arguable; a timestamp is either in the past or it is not. `check:bean-blocks`
enforces the four fields on any bean carrying this heading.

### An external block's expiry is a RE-ASK date, not a takeover date

The corpus forced this the day the gate was written. `cz17` waits on **WHO's
DAK Logical Model being final in FHIR**. There is no honest date on which an
agent should "take that over" — inventing one would be fabricating a schedule
for a standards body, which is worse than no expiry at all.

So an expiry answers *"when should somebody look at this again"*, and the
**handoff says which kind it is**:

- a block on work inside this repository → on expiry, take it over;
- a block on an external party, an owner ruling, or another bean → on expiry,
  **re-raise and move the date out**, saying so.

Both are checkable, and neither lets a bean sit forever unexamined. What the
gate refuses is an expiry that is *absent*, not one that gets extended with a
reason.

**The expiry is the part that matters.** A block with no expiry is
indistinguishable from abandoned work, and the agent that finds it has no way
to tell whether to wait or take over. An expired block is a *signal* — it means
"take this over" — rather than a bean quietly sitting forever.

## Prefer sub-beans to blocking

Most blocks are really "one part of this is stuck". Split it: the stuck part
becomes a child bean carrying the block, and the parent stays in progress.
That keeps the work pickup-able and makes the actual dependency legible instead
of hiding it inside a status.

Sub-beans are also what make parallel work possible without a swarm — see
`swarm-management.md` before deciding you need one.

## Never

- **Never mark a bean blocked to end a turn tidily.** If you are stopping for
  the day, the bean is still in progress; say so in the report.
- **Never leave a block without an expiry.** If you cannot say when it goes
  stale, you have not established that it is a block.
- **Never block on something you have not actually asked for.** Asking is the
  work; waiting to be asked is not a dependency.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [KG to public portal](../../processes/kg-to-portal.html) | Record the decision as still open |

