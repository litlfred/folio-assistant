---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Where does this go?'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/where-does-this-go.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/where-does-this-go.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/where-does-this-go.md){: .fa-edit-source }

{% raw %}
# Where does this go? — the question, then the skill that answers it

> Skill id: `where-does-this-go` · Package: `folio-core`

**This skill answers nothing.** It is a switchboard: you arrive knowing you
have something to put somewhere, and it tells you which of this repository's
nine filing rules you are actually standing in front of. The rule itself lives
where it always lived.

That division is the whole design, and it is the banner atop `AGENTS.md`
applied to itself: *"a rule stated in two places is a rule free to drift, and
the copy a reader finds first is the one with no test."* A router that
summarised each answer would be nine summaries free to disagree with nine
skills. So every row below is a **question and a pointer**, and the moment a
row starts explaining the answer it has become the defect it exists to avoid.

## Why a router at all — the failure it addresses

Owner, 2026-09-21: *"Need a meta-process 'where to file things' as we have lots
of specialized instances of that."*

Each specialised answer is well argued **in isolation**, and that is precisely
the problem. Knowing that `content-context-and-state-graphs` settles
`holds` does not help an agent who has not realised they are choosing a graph
kind; they file by resemblance to the last thing they filed. **An agent who
does not know a rule exists cannot look it up**, and the corpus offers no
surface on which the nine rules appear together.

Bean `f258`, and that bean is its own example: choosing where to file IT took
a judgement call between a PROCESS epic, QA, and the knowledge graph.

## The nine questions

Read down the middle column until one matches what you are actually deciding.
If two match, you have two decisions, not one — take them in the order below,
because the earlier rows decide the object and the later ones decide its
placement.

| # | the question you are actually asking | who answers it |
|---|---|---|
| 1 | Is this a work item, a sign-off, or a code review? | [`issue-working`](issue-working.md) §"What an issue is *for*, against its neighbours" |
| 2 | Is this feature work that needs a GitHub issue first? | [`crdm-detect`](crdm-detect.md) §"Issue association" |
| 3 | What TYPE of bean is it, and under which parent? | [`todo-manager`](todo-manager.md), and `check:bean-parents` enforces it |
| 4 | Does a bean for this already exist? | [`todo-manager`](todo-manager.md) §"Check before you create" |
| 5 | May I claim it — is a sibling already on it? | [`bean-coordination`](bean-coordination.md) §"A claim is branch-local" |
| 6 | Which directory, and what KIND of graph does it hold? | [`content-context-and-state-graphs`](content-context-and-state-graphs.md) and [`directory-conventions`](directory-conventions.md) |
| 7 | Is this an adapter, a profile, or a visualiser? | [`content-profiles`](content-profiles.md), and [issue #764](https://github.com/litlfred/folio-assistant/issues/764) for the axis still open |
| 8 | Does this belong in `AGENTS.md` or in a skill? | the banner atop [`AGENTS.md`](../../../AGENTS.md) — **always the skill** |
| 9 | Is this a skill, or an agent's memory? | [`agent-memory`](agent-memory.md) |

**Nine, and the count is here on purpose** where the repository's own rule is
usually *never quote a count from prose*. The difference is what the number
is FOR: a count of findings is a measurement that ages, while this one is a
claim about the table directly beneath it, falsifiable by looking down. When
a tenth rule is added and this still says nine, the table is one line away
from proving it wrong — which is the opposite of a stale measurement nobody
can check.

## Two rows that are easy to confuse, and the discriminator for each

**Rows 1 and 3.** "Bean or issue?" and "what type of bean?" feel like one
question and are not. The first asks what KIND OF OBJECT this is — a bean is
the work plan, an issue is where a human signs off, a PR is where code is
reviewed. The second only arises once row 1 has answered "bean". Taking them
together is how a design discussion ends up as a `task` with no issue behind
it.

**Rows 6 and 7.** Both sound like "what is this thing?". Row 6 is about a
DIRECTORY and its graph; row 7 is about a CONTENT TYPE and its vocabulary.
The discriminator: row 6 asks *what does a running process do with this —
produce it, read it, or write it as it goes*; row 7 asks *whose vocabulary is
this word from, and may this folio use it*. A directory has no vocabulary and
a block kind has no `holds`.

## When no row matches

**That is a finding, not a licence to improvise.** The honest move is to say
so — in the turn, to the person — and propose where it would go if a tenth
row existed. Filing by resemblance to the last thing you filed is what
produced nine rules nobody can see at once.

If the same unmatched question recurs, it has earned a row, and the route to
adding one is [`surprise-to-corpus`](surprise-to-corpus.md): the recurrence is
the evidence, and the person decides.

## What this skill is NOT

It is not a decision procedure you run every turn. Filing decisions are
frequent and mostly obvious, and a router consulted for every obvious one is
overhead that gets skipped, taking the non-obvious cases with it. Reach for it
when you notice yourself **about to guess** — which is the same trigger
[`opening-brief`](opening-brief.md) uses, and for the same reason: the cost is
in the decision nobody paused over.
{% endraw %}
