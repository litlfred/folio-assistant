---
layout: default
title: 'A confirmation can be waived'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/confirmation-waiver.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/confirmation-waiver.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/confirmation-waiver.md){: .fa-edit-source }

{% raw %}
# A confirmation can be waived — by the person who is owed it

Several rules here stop an agent and hand a decision back: merging to `main`,
removing a durable artefact, spawning a swarm, closing a bean whose evidence
the session could not re-derive, re-entering a process it fell out of. Each is
right, and each costs the owner a round trip.

**The owner, 2026-09-20:**

> *"human can waive confirmation rights (e.g. for session, for process run)"*
> *"context dependent, should be in memories"*

So the gate is not the last word. **The person who is owed a confirmation may
give it in advance, for a stated scope.** That is not an agent making an
exception for itself — it is the same decision, made earlier, by the same
person. The distinction is the whole rule, and every clause below exists to
keep it true.

## A waiver is five fields, and none is optional

| field | what it carries | why it cannot be omitted |
|---|---|---|
| `granted_by` | the person, by the identity the repository already knows them by | a waiver with no grantor is an agent's own decision wearing a hat |
| `quote` | **the grantor's own words, verbatim** | the agent's paraphrase is the thing under suspicion; a summary can widen a scope without anyone noticing |
| `gate` | which gate class is waived (below) — never "everything" | a blanket waiver is indistinguishable from no rule, and nobody can audit what it covered |
| `scope` | `session:<id>`, `process:<instance-id>`, or `until:<ISO-8601>` | an unscoped waiver outlives the situation that justified it |
| `expires` | a timestamp, always | same argument [`bean-blocking.md`](bean-blocking.md) makes for a block: **a waiver with no expiry cannot be told from one nobody remembered to withdraw** |

A waiver missing any field is **not a waiver**, and the gate stands. An agent
that finds a malformed one asks, exactly as if none existed.

## The gates that can be waived, and the rules that cannot

> **A waiver relaxes a rule whose text is *ask first*. It can never relax a
> rule whose text is *never*.**

That single line is what keeps this skill from being a hole in every other one.
`AGENTS.md` says **never delete ANY bean**; no waiver reaches it, because the
rule is not a confirmation the owner is owed — it is a prohibition, and the
non-destructive move (`scrapped`, with reasons) is always available.

| gate class | the rule it relaxes | waivable |
|---|---|---|
| `merge-to-main` | [`crdm-requirements-workflow`](../crdm/crdm-requirements-workflow.md) §Phase 6 — explicit confirmation before merging | yes |
| `bean-close` | [`bean-coordination`](bean-coordination.md) §"When you cannot re-derive it yourself" — the `ready-to-close` batch | yes |
| `deletion` | [`deletion-requires-confirmation`](deletion-requires-confirmation.md) — report and wait | yes, **per artefact class**, never blanket |
| `swarm-spawn` | [`swarm-management`](swarm-management.md) — asked every time, per swarm | yes, with the agent count and model level named in the quote |
| `process-reentry` | [`process-state`](../workflow/process-state.md) — confirm before re-entering | yes |
| `issue-close` | [`issue-working`](issue-working.md) — an agent never closes an issue on its own say-so | yes; the waiver names the issues |
| *bean deletion* | `AGENTS.md`, "never delete ANY bean" | **no — a prohibition, not a gate** |
| *fabricating evidence* | anywhere a rule says re-derive rather than quote | **no** |

An `AGENTS.md`-level *never* that somebody wants waived is a change to the
skill that owns it, argued and landed — not a waiver.

## Where a waiver lives — the context graph, never the work plan

A waiver is **context**: read at the start of a turn, consulted by whatever gate
is about to fire, and never produced by the work it governs. That is the
`context` layer as [`content-context-and-state-graphs`](content-context-and-state-graphs.md)
defines it, so a waiver is a node under `memory/waivers/` — the same graph an
agent's durable memory lives in, which is what the owner meant by *"should be
in memories"*.

**Not `beans/`.** The work plan is `state`: it records what is being worked on
and where it got to. A waiver is not work, has no Done-when, and must be
readable by a gate that fires before any bean is opened. Putting it in the work
plan would also make it branch-local, and a session-scoped waiver granted in
chat would then be invisible to the very session it was granted for.

**Not `interaction/` either**, although it is the other `context` directory:
that one is read at session start and *never written by a process*, and a
waiver is granted mid-session by definition.

## Consulting one — the three-state read, as everywhere else

Before a gate fires, look for a waiver in scope. There are **three** answers,
not two, and the third is the one that gets skipped:

1. **A valid waiver covers this gate, in scope, unexpired** → proceed, and say
   in the turn report *which* waiver you are acting under, quoting its words.
   A waived action is still an announced one.
2. **No waiver** → ask, exactly as the gate's own skill says.
3. **Could not determine** — `memory/waivers/` unreadable, a malformed node, a
   clock you cannot trust → **ask**. A gate that cannot read its waivers has
   not been waived; it has failed to check, and the two are not the same.

An expired waiver is **kept, never deleted** — same argument as a `scrapped`
bean. The record of what was permitted, to whom and when, is what makes the
next grant reviewable, and a deleted one leaves a reader unable to tell a
withdrawn permission from one that never existed.

## What an agent may never do

- **Grant itself a waiver.** A waiver whose `quote` is not the grantor's own
  words does not exist. If you are composing the sentence, you are the grantor,
  and you are not allowed to be.
- **Widen one.** `session:` does not reach the next session; `process:` does not
  reach a sibling instance; `deletion` for build artefacts does not reach
  content. When the scope does not plainly cover the case in front of you, it
  does not cover it.
- **Infer one from tone.** "go ahead", "yes", "do it" discharge the gate they
  were said to — that is an ordinary confirmation, and it needs no waiver node.
  A *waiver* is a standing grant over future gates, and it is recorded only
  when the owner says something that plainly is one.
- **Treat a waiver as a reason to skip the work.** `merge-to-main` waived still
  means green CI and no conflict; `bean-close` waived still means the evidence
  is quoted in the bean. A waiver removes the *asking*, never the *doing*.

## Checked, not trusted

`bun run check:waivers` reads every node under `memory/waivers/` and fails on a
missing field, a `gate` outside the table above, a scope that names a
non-existent session or instance, and a waiver over a non-waivable rule. It
reports expired waivers as **inert**, never as findings — they are history.

Because the check reads the same table this skill publishes, a gate class
added here without a row is refused, which is the property that stops the
vocabulary drifting into "everything".
{% endraw %}
