---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Surprise to corpus'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/surprise-to-corpus.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/surprise-to-corpus.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/surprise-to-corpus.md){: .fa-edit-source }

{% raw %}
# Surprise to corpus — notice it, filter it, then ask

> Skill id: `surprise-to-corpus` · Package: `folio-core`

Owner, 2026-09-21:

> was there something unexpected that happened (stastically so, logically so)
> then, if it is is happening during a defined process that is
> happeneing/expecting to happen often, it may be worth a new
> skill/guidance/tool refinment. if so prompt the user to add to corpus.

Three clauses, and each is load-bearing: **notice**, **filter by recurrence**,
**prompt**. Dropping any one gives a different and worse rule — the first
alone is a diary, the first two are an agent rewriting the corpus on its own
authority, and the third without the second is a prompt every turn until
people stop reading them.

## 1. What counts as a surprise

**Ask it as after-action review asks it**, which is the literature the owner
settled on for this half (2026-09-22), and only for this half:

> **What did you expect to happen, what actually happened, and why the
> difference?**

That framing earns its place for one reason: it makes the surprise
articulable BEFORE you know whether it matters. "Something felt off" is not
reviewable; "I expected the tracer to read the mask as ink and it read the
ground" is. The filter in §2 then operates on a statement rather than on a
feeling, which is the difference between a rule that can be applied
consistently and one that reduces to mood.

**LOGICAL surprise is where this starts, and statistical surprise is not yet
available.** "Statistically unexpected" implies a base rate, and the corpus
carries none — nothing here records how often a gate fires, how often a merge
conflicts, or how often a selector breaks. Claiming a statistical surprise
today would be asserting a distribution nobody measured, which is the defect
this repository names most often in other clothes.

Logical surprise is cheap to detect and needs no baseline. It is any of:

- **A premise turned out false.** You believed something about the system,
  acted on it, and the system disagreed.
- **A gate fired for a reason nobody predicted** — including a gate that
  passed when you expected red.
- **A command failed and the failure was invisible**, because whatever ran
  next produced plausible output anyway.
- **Two things that looked like one thing**, or one thing that turned out to
  be two.

### The four this rule was written from, all in one session

Each cost a cycle, and each reached the corpus only because somebody happened
to notice:

| # | the surprise | the general shape |
|---|---|---|
| 1 | `potracer` treats ZERO as foreground — the inverse of what the name suggests | a library whose convention is the opposite of its name |
| 2 | `Image.crop` past the edge pads with BLACK, which a tracer reads as ink | a default that is invisible until another tool interprets it |
| 3 | `.fa-qr-toggle` stopped being an IDENTITY the moment a second button reused it as a box class, breaking 39 selectors at once | a name doing two jobs, discovered when the second arrives |
| 4 | a bean id sliced one character short — `hvw` for `ahvw` — failed silently behind a `tail -1`, after the wrong id was already in a pushed commit | a truncated identifier that still LOOKS like an identifier |

**Number 4 is the argument for the whole rule.** It was caught by accident,
and nothing in the process would have caught it otherwise.

## 2. The recurrence filter — the part that stops the noise

> **A surprise inside a one-off is an anecdote. The same surprise inside a
> process that runs often is a defect in the process.**

Without this filter the rule fires every turn, because every non-trivial turn
contains something somebody did not expect. With it, the question is narrow
and answerable:

> **Did this happen inside a defined process that runs often — and would the
> next agent running that process hit it too?**

Both halves. A rare process can still be worth guarding if its failure is
expensive, but then say *that* rather than claiming a recurrence you have not
seen. And "the next agent would hit it too" is what separates a fact about
the system from a fact about the mistake you personally made.

Three ways a candidate fails the filter, all of which should end in silence
rather than a prompt: it happened once, in a process nobody runs twice; it
was your own slip and the system behaved as documented; or the corpus already
says it and you had not read that part. **The third is the common one**, and
checking costs one `grep`.

### The second one has a blameless reading, and it is the sharper one

After-action review's central move is that a finding is about the SYSTEM
rather than about the person, and applied here it does not widen the filter —
it says more precisely what the filter was already testing. "My own slip"
almost never fails on its own. It fails when the system behaved as
documented AND nothing about the system made the slip easy. Where the system
DID make it easy, the second half of the filter — *would the next agent hit
it too* — is already true, and the candidate passes.

The worked case is number 4 below. Reading it as "I mis-copied an id" makes
it a slip and files nothing. Reading it blamelessly asks why a wrong id was
easy to produce and easy to miss, and the answers are properties of the
system: a truncated id is still a well-formed id, and a `| tail -1` hides a
non-zero exit. Both are things the next agent meets unchanged.

**This is a refinement of the wording, not a change to the rule.** Saying so
matters: adopting a methodology and then claiming it altered more than it did
is how a corpus acquires vocabulary without acquiring discipline.

## 3. PROMPT, never write

**The agent proposes; a person decides.** This is
[`deletion-requires-confirmation`](deletion-requires-confirmation.md) pointed
the other way — that skill governs removing a durable artefact on your own
initiative, this one governs ADDING durable guidance on your own initiative,
and the argument is the same: the corpus is read by every future session, so
a wrong line in it is a wrong line everywhere, and the person who has to live
with it should be the one who agreed to it.

What a good prompt contains — the same six parts
[`interaction-modality`](interaction-modality.md) §4.1 binds every handed-over
decision to, and the test is identical: **can the reader answer without
opening anything?**

1. **What happened**, concretely, with the measurement or the error text.
2. **Which process it happened in**, named.
3. **Why it will recur** — the filter above, argued rather than asserted.
4. **What you propose**: a new skill, a line in an existing one, or a tool
   change. Say which, and where it would live —
   [`where-does-this-go`](where-does-this-go.md) is how you answer that.
5. **Your recommendation**, marked as such.
6. **What happens if they say nothing**: nothing gets written, and the
   candidate is filed as a bean so it is not lost.

That last part matters. A prompt whose only outcome is "yes" or a dropped
observation makes silence expensive, and a person under load will
reasonably ignore it. **A bean is the third state** — recorded, unactioned,
findable — and it is what turns an unanswered prompt into something the next
session can pick up rather than rediscover.

## 4. When to run this

**At the end of a task**, not continuously. The review is a single pass over
what actually happened: was anything unexpected, does it pass the filter, and
if so what is the prompt. Most turns produce nothing and should say nothing —
a loop that reports "no surprises" every turn is a loop people stop reading,
which is the same disease as a report with a standing false entry.

It pairs with [`turn-reporting`](turn-reporting.md), which governs the shape
of the report you were already writing. This governs one question the report
should have asked itself and usually does not.

## What this skill deliberately does not do

**It does not define a severity scale.** Ranking surprises would invite
filing the low ones, which is the noise the recurrence filter exists to
prevent. A candidate either passes the filter and is worth a person's
attention, or it does not and is worth a bean at most.

**It does not automate the corpus change.** There is no tool here, on
purpose: a mechanism that could write guidance would be used to write
guidance, and clause three is the whole point.

## Provenance — which methodology, and what it did NOT settle

Owner, 2026-09-21: *"any lit we need on proven methdologies to help?"*, and
2026-09-22: **after-action review, for part 1 only.**

What it contributed: the expected/actual/why framing in §1, and the blameless
reading of the slip exclusion in §2. What it did not contribute, deliberately:

- **No incident severity scale.** AAR practice usually grades by impact, and
  this skill still refuses to — see the closing section. Grading would invite
  filing the low ones, which is the noise the recurrence filter exists to
  prevent.
- **No timeline reconstruction.** AAR for an outage rebuilds a sequence
  because the sequence is contested. Here the agent was present for the whole
  turn and the transcript is the timeline.
- **Nothing for part 2.** The routing half, [`where-does-this-go`](where-does-this-go.md),
  draws on no methodology. Information architecture was considered and
  declined on scale: nine rules is below the point where faceted
  classification earns its complexity, and what the corpus lacked was an
  index rather than a taxonomy.
{% endraw %}
