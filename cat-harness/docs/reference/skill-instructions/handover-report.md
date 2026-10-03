---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Handover report'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/sdlc/sdlc-core/handover-report.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/sdlc/sdlc-core/handover-report.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/sdlc/sdlc-core/handover-report.md){: .fa-edit-source }

{% raw %}
# Handover report

An agent's state lives in three places that do not survive it: the chat, its
scratchpad, and uncommitted work in its worktree. A **handover report** moves
the parts that matter into the repository, as a committed bean note, so the
next agent starts from fact rather than from guesswork.

To produce one under time pressure, follow [`prepare-for-handover`](prepare-for-handover.md): it commits and pushes first, then writes this report citing the pushed SHAs.

This skill is not `agent-handoff` (PR #1884), which hands
**one task** to a named agent in another environment. A handover report is a
**snapshot of everything one agent is holding**, written for whoever turns up
next, which may be no one in particular.

## When to write one

- **When told a stall is likely.** Write it first, before continuing any work.
  A report written after the stall is never written.
- **Before a long or risky step**: a 30-minute regenerate, a big merge, a
  disk-heavy run.
- **At the end of an arc**, even a successful one, if anything stays open.
- **When a steward or the owner asks.**

Write it **short and early**, then update it. A 20-line report pushed now is
worth more than a complete one that never lands.

## Where it goes

A bean note on the bean you are working, or on its epic if you hold several:

```sh
bun run beans:note <bean-id> --title "handover: <role> <date>" \
  --body-file <file> --branch <your-branch>
bun run beans:notes          # rewrites the index; commit both files
git add -A && git commit && git push
```

One file per branch per bean, so two agents writing handovers never conflict
([`bean-coordination`](bean-coordination.md) §"Adding to a bean — a note, not
an append"). **Write it in your own worktree.** Some tools write into the main
checkout instead; if you are a subagent, check `git status` there afterwards.

Push it, even onto a draft PR or a red branch. An unpushed report does not
exist.

## The template

Mix narrative with formal content. The tables are what a triage agent parses;
the prose is what a person reads.

```markdown
## Handover report: <role> (<session or agent>)

- **Session:** <session URL, or the parent session plus agent id>
- **Written:** <UTC time>, <why: stall expected / end of arc / asked>
- **Role and mandate:** <one line; the owner rulings that bound you>

### Where I'm going (current arc)
<2–4 sentences: the goal, the epic it serves, and what "done" looks like.>

### Done so far
- <outcome, with PR, commit or bean>

### Next in queue
1. <next concrete step: command, file, PR>
2. …

### In flight
| item | kind (PR / branch / bean / process run) | state | next action | owner |
|---|---|---|---|---|

### Blockers and dependencies
| blocker | waits on | since | expires / re-check |
|---|---|---|---|

### Decisions pending (owner)
- <question, with options and your recommendation, so it can be asked cold>

### Unpushed or at-risk state
- <scratchpad files, local commits, running jobs, and whether each is reproducible>

### How to resume
<the first three things the next agent should do, in order>
```

## Rules

1. **Facts with provenance.** Write "CI red on `abc123` (check X)", not "CI is
   flaky". Give SHAs, PR numbers and bean ids, never "the branch".
2. **Say what is NOT pushed.** Unpushed commits, scratchpad plans and running
   background jobs are exactly what a stall destroys. Name each one, and say
   whether it can be rebuilt.
3. **Owner rulings verbatim**, with the date. A ruling paraphrased in a
   handover becomes a different ruling by the second handover.
4. **Never put secrets in it.** Name secrets, never give their values.
5. **Blocks follow [`bean-blocking`](bean-blocking.md):** what it waits on,
   since when, and when to re-check, so a stale block can be told from a live
   one.
6. **Update in place.** Re-run `beans:note` on the same branch and bean, which
   gives the same file. Do not append a second report.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Stalled-agent triage: collect handovers, consolidate themes, recommend, re-route](../../processes/stalled-agent-triage.html) | Collect or reconstruct a handover report per agent |

