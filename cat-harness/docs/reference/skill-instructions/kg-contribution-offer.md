---
layout: default
title: 'Offering the knowledge graph'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/kg-contribution-offer.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/kg-contribution-offer.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/kg-contribution-offer.md){: .fa-edit-source }

{% raw %}
# Offering the knowledge graph — the question nobody was asking

Owner, 2026-09-20: *"update CRDM process that when a user is done with
requirements on some workflow ask if/how to add into knowledge graph(s), give
options."*

## The gap this closes

CRDM elicits requirements, agrees them, signs them off — and then they exist as
an issue and a conversation. **Nothing asked whether they should become
knowledge-graph content.** So the output of the process that exists to produce
durable requirements was the one thing the knowledge graph never learned.

That is a shape this repository has paid for before: a fact established in a
session, and no step that writes it anywhere a later agent looks.

## What this skill is NOT

It is **not** a decision procedure for where a node goes. That is
[`placement`](placement.md), and it is an *agent's* procedure: which instance,
which declared graph, which kind of node, which stub convention. Run it **after**
this skill has an answer, not instead of it.

It is **not** general guidance on asking questions. That is
[`interaction-modality`](interaction-modality.md) §4.1, and this skill does not
restate it — it **obeys** it, and adds the one thing §4.1 cannot supply: what
the options actually are here.

It is **not** what to do when the author CORRECTS a rule. That is
[`symbiotic-interaction`](symbiotic-interaction.md) §2, and it runs the other
way: the node already exists, the author has just said it is wrong, and the
correction is written into it **in the same turn without an offer**. Offering
there asks the author to repeat a correction they have already made, which is
§2's opening failure.

The line between the two is one question: **does the rule already have a home?**
A ruling on something already in the graph is an edit and needs no offer; a
ruling that implies a node which does not exist is this skill's case, unless the
author named the destination themselves.

The division in one line:

> **This skill decides what to offer. `symbiotic-interaction` §2 decides what
> needs no offering. `placement` decides where the answer lands.
> `interaction-modality` decides the shape of the asking.**

## The rule with teeth

> **The agent never picks a destination silently.**

An agent that decides on its own that a requirement "is really a skill" and
writes one has manufactured a node nobody asked for, in a graph somebody else
maintains. The offer exists so that does not happen. If the person does not
answer, the default applies — and **the default creates nothing.**

## One question, not two

"Should this enter the knowledge graph at all" and "as what" look like two
questions. They are asked as **one**, and the reason is not brevity:

- Splitting them costs two interactions to reach one answer, which for a
  low-dexterity person is a real cost, not a stylistic one.
- The worry that collapsing them answers the second by default is met by
  making **"none of these" a listed option**, not by adding a round. A
  destination question with no `none` is what forces an answer; one with `none`
  does not.

So: one question, destinations as options, `none` among them, a stated default.

## One question for the SET, not one per requirement

A six-phase CRDM run can agree many requirements. Asking six times is worse
than asking once — it is the same failure as a form that re-asks what it was
already told (WCAG 2.2 SC 3.3.7, Redundant Entry).

So the offer **names the set** and asks once. If the person wants different
destinations for different items, they say so and the agent asks follow-ups
about the ones that differ. That path is opened by their answer, never assumed.

## The options are DERIVED, never invented

The destinations are the graphs this instance declares, in `<name>.json` —
read at the time of asking, so an instance that adds a graph gets it in the
offer without anybody editing this file. Never a list typed from memory: that
is how an option set goes stale and starts offering a graph that moved.

**Not every declared graph is an authorable destination.** A store that is
*incoming* (`uploads`), *derived* (`qa`, `health`, `translation-sources`) or a
*record of something that already happened* (`issue-marks`, `memory`) is not
somewhere a requirement is authored into. Offer the graphs whose nodes a person
writes:

| offer | because |
|---|---|
| a **skill** (`cat-harness`) | the requirement is a rule an agent must follow |
| a **BPMN process** (`cat-harness`) | it is a sequence with lanes and gateways |
| a **schema** (`schemas`) | it constrains the shape of data |
| a **Tool** (`tools`) | it is a capability with declared io |
| **documentation** (`docs`) | it is a **design-memory asset** — see below |
| a **bean** (`beans`) | it is work to be done, not knowledge to be kept |
| an **`fsh-guts` proposal** | it is a design not yet agreed — and see the warning below |
| **folio content** (`folio`) | it is subject matter, not platform |
| **none** | it is already captured by the issue and the code |

## The design-memory asset, and the question that identifies one

Owner, 2026-09-21, ruling on a CRDM sign-off where the offer above had been
made without `docs` in it:

> this is a memory asset as part of design, so it goes into docs/. update
> skills for documentation filing. fsh-guts can be thrown away/lost... this was
> an asset as part of building a feature (or accessing data, or other skill
> realtaed to manament/rendering of that type of content) but it is not the
> content we want displayed itself.

**One question separates this class from every other destination:**

> **Was this produced while BUILDING something, rather than being the thing
> that was built?**

A requirement set, an options analysis, a measured comparison, the reasoning
behind a schema: each is an artefact of the work rather than its output. It is
not subject matter, so it is not `folio`. It is not a rule an agent follows, so
forcing it into a skill makes the skill corpus carry a history. It is not work
outstanding, so it is not a bean. **It is memory**, and `docs/` is where this
instance keeps memory a person reads.

### Why NOT `fsh-guts`, stated because it is the tempting wrong answer

`fsh-guts` is the declared **non-rendered trashcan** — *"where deprecated,
throwaway stuff goes"*. Its content may be **thrown away or lost**, which is
the whole point of having it. Filing a design record there says *"this may be
discarded"* about something whose entire value is that it survives.

The distinction is not status but **durability**: a proposal not yet agreed can
afford to be lost; the reasoning behind something already built cannot, because
the code it explains will outlive every conversation about it.

### And not a skill either, when it is history rather than instruction

A skill is read by an agent about to act. A design record is read by a person
asking *why is it like this*. Putting the second in the first makes every agent
load a history to find a rule — and it is how a skill corpus grows past the
size at which anyone reads it.

### WHOSE `docs/` — the owning instance's, not the repository's

Owner, 2026-09-21, sharpening the ruling:

> if it is realated to some harness/feature/tool that detailed
> infromation/design/planning/etc go into that harness' docs/

**`docs/` is not one place.** It is a declared graph, and an instance that owns
a feature owns the record of why that feature is shaped as it is. Measured in
this repository on the day of the ruling: `cat-harness/docs/` and
`who-iris/docs/` both exist, and `who-iris` declares `docs` among its own
graphs — so this is already a real distinction rather than a future one.

The question is the same one [`placement`](placement.md) Step 1 asks of every
node: **which instance owns this?** A design record for a `cat-harness` feature
files in `cat-harness/docs/`; one for a folio's own subject matter does not
belong in the platform at all. Filing a feature's reasoning in the wrong
instance's `docs/` is the same defect as a platform literal naming one folio —
it reads fine and it is unreachable from the place that needs it.

### What ELSE belongs there, and the line against a skill

The same ruling names two more kinds:

> docs/ can also include information about how to access data sources related
> to the content described or provide more detailed information that is beyond
> what a human/agent needs to know in order to perform a task if they are
> competentnt in the given skill.

So `docs/` holds, besides the design record:

- **how to reach the data** a piece of content describes — endpoints,
  credentials policy, shapes, quirks of a source;
- **everything past the competence line**, which is the sharp test:

> **A skill carries what a competent practitioner needs IN ORDER TO DO the
> task. Anything beyond that is documentation.**

That line is what stops a skill growing into a manual. Background, derivations,
the survey of options not taken, the API's full surface when the task touches
three calls: all real, all worth keeping, none of it needed to act. A skill
that carries them makes every agent read a chapter to find a rule — and it is
why a corpus drifts past the size at which anybody reads it.

The converse failure is equally real and less visible: a rule an agent must
follow, filed in `docs/` because it came with context, is a rule
`skill_fetch` will never serve.

**Where in that instance's `docs/`** is [`placement`](placement.md)'s question,
not this one.

`none` is not a politeness. A requirement whose whole content is *"the button
should be blue"* becomes a commit and nothing else, and a graph that acquires a
node for it is a graph with a node nobody will ever read.

## What the agent does with the answer

1. Run [`placement`](placement.md) for the chosen kind — it decides instance,
   graph and node kind, and it is the step that catches a hardcoded path or a
   literal naming one folio.
2. Create a **bean** for the authoring work, parented to the feature's epic.
   The offer produces a decision, not a node: writing the skill or the diagram
   is work, and work here is a bean before it is a file.
3. Record the answer where the next agent will see it — on the issue, with the
   round summary [`issue-working`](issue-working.md) already requires.

On `none`: record that too. *"Asked, answered none, because the requirement is
carried by the code"* is a fact the next agent needs, and its absence is
indistinguishable from never having asked.

## Related

| | |
|---|---|
| the shape of the asking | [`interaction-modality`](interaction-modality.md) §4.1 |
| a correction to a rule that already exists — no offer | [`symbiotic-interaction`](symbiotic-interaction.md) §2 |
| where the answer lands | [`placement`](placement.md) |
| the process step | [`crdm-signoff.bpmn`](../../methodologies/crdm/workflows/crdm-signoff.bpmn) |
| the round summary that records it | [`issue-working`](issue-working.md) |
| why work becomes a bean first | [`todo-manager`](todo-manager.md) |
{% endraw %}
