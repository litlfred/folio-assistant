---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'The comparison goes BEFORE the question, not inside the options'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/decision-comparison.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/decision-comparison.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/decision-comparison.md){: .fa-edit-source }

{% raw %}
# The comparison goes BEFORE the question, not inside the options

[`interaction-modality`](interaction-modality.md) §4.1 fixes the *order* —
context → options → recommendation → question — and requires each option to
carry what it costs. This says what "the comparison" has to contain, and where
it has to live.

**Not to be merged with [`decision-audit`](decision-audit.md).** That records
why a decision *was* made, after the fact, and governs overruling a QA finding.
This is about what a person is shown *before* they decide. Opposite ends of the
same act, and a skill that tried to be both would be read at the wrong moment.

## The failure this prevents

A selection tool gives each option a short label and a short description. It is
tempting to put the trade-offs there — it *looks* like the right field, and the
tool will happily render them.

**It is the wrong place, for three reasons that compound:**

1. **A reader sees one option at a time.** The whole value of a comparison is
   reading the rows *against each other*; an interface that reveals them
   separately has destroyed the comparison while appearing to present one.
2. **There is no room.** A description is a sentence or two. Every trade-off
   gets compressed to its headline, and the second-order consequences — the ones
   that actually decide it — are the first thing cut.
3. **It cannot be re-read.** The preamble stays in the transcript; a focused
   option label does not.

### Worked example — this agent, 2026-09-20

Asked the repo owner to choose how a graph kind gets registered. Four options,
each with a real cost written into its `description`, a recommendation marked,
and a default stated. It passed every item in `interaction-modality` §4.2.

**The owner dismissed it**, and asked for *"better comparison, pros, cons,
recommendation, downstream impacts … given context before the question."*

What was missing was not effort. The costs were there, but scattered one per
option behind an interface that shows them singly; nothing said what each choice
*forecloses*; and the four could not be read side by side. The preamble had
narrated the problem at length and then handed over four names.

## What a comparison contains

Per option, five things — and the fourth is the one that gets skipped:

| | |
|---|---|
| **What it does** | the mechanism, in one line |
| **Pro** | what it buys, stated as a benefit rather than an absence of harm |
| **Con** | what it costs to *do* |
| **Downstream impact** | what it changes for everything else, afterwards |
| **Reversibility** | how expensive it is to undo once taken |

Then, once, for the set: the **recommendation with its reasoning**, and the
**default** that applies if nobody answers.

### Cost and downstream impact are different, and conflating them is the bug

**Cost** is what the change takes: files touched, tests to rewrite, hours.
**Downstream impact** is what the world looks like afterwards: what becomes
easy, what becomes hard, what a future contributor now has to know, which other
decisions are now foreclosed or forced.

A cheap change with a large downstream impact is the most dangerous option on
any list, and it is precisely the one that reads best when only cost is shown.
Say both, separately, or the reader cannot see it.

### Reversibility is not a nicety

[`opening-brief`](opening-brief.md) triggers on **irreversibility and surprise**
rather than size, and the same measure applies here. Two options with identical
cost and impact are not equivalent if one can be undone in an afternoon and the
other is load-bearing within a week. State it per option; it is often the thing
that settles the choice.

## Where it lives

**In the prose that precedes the question.** A table is usually right — the
columns above are a table's columns, and a table is the one layout that shows
rows against each other.

**The options in the selection tool are then LABELS for choices already
explained.** A label names the option and, at most, restates its headline. A
reader who has read the preamble should be able to choose from the labels alone;
a reader who has not should find nothing new hiding in them.

That inversion is the whole rule. If the labels are where the information is,
the comparison was never made.

## When this does not apply

**A small, reversible choice does not earn a table**, and building one for it is
its own failure — the reader pays attention for something that did not need it.
The trigger is the same as `opening-brief`'s: would getting this wrong be
expensive or surprising? If no, recommend and proceed.

**One-option "decisions" are not decisions.** If the honest comparison has one
viable row, do not manufacture alternatives to fill a table. Say what you are
doing, say why the obvious alternative loses, and proceed.

## Done properly, it also answers the count rule

`interaction-modality` §4.1 requires that with several decisions open you ask
**one in full and give a count for the rest**. A full comparison is what "in
full" means. The rest get a number, never a row from a table they cannot see.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [CRDM Phases 2–4 — BPA and requirements](../../processes/crdm-requirements-definition.html) | Phase 4a: Compare the viable options |

