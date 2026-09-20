---
layout: default
title: Covered is not reachable
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/covered-is-not-reachable.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/covered-is-not-reachable.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/covered-is-not-reachable.md){: .fa-edit-source }

{% raw %}
# Covered is not reachable — and `check:tools` cannot tell you which

**A skill can be satisfied by the *neighbours* of its mechanism while the
mechanism itself is reachable from nothing.** `check:tools` reports the skill as
covered and is right to: coverage is a relation between a Tool and a **skill**,
never between a Tool and a command.

Found three times in one session, 2026-09-20, working bean `d308`:

| skill | nodes satisfying it | what none of them did |
|---|---|---|
| `kg-export` | 5 — `pages-publish`, `serve-rendering`, three schema carriers | run an export |
| `docs-generation` | 2 — `readme-audit`, `readme-sync` | generate a page of the docs site |
| `translation-manager` | 5 — extract, inject, status, signoff, validate | reach the round-trip QA |

Three is a pattern, not a coincidence, and the cause is structural rather than
careless: nobody was asking the second question.

## The two questions, kept apart

> **"Does this skill have a Tool?"** — `bun run check:tools`, and
> `bun run tools:coverage` for which of the uncovered ones warrant one.
>
> **"Is this command reachable by asking the graph?"** — nothing yet. Bean
> `d308` measured it by hand: of 868 code files, 229 are reachable from no node,
> collapsing to 13 groups.

**A skill showing as covered is not evidence that its code is reachable.** Using
the first question to answer the second is how three mechanisms stayed invisible
while their skills looked served.

## What to do when you meet one

Add the node for the mechanism. Then two things not to do:

- **Do not widen an existing node's `satisfies`** to make the gap look closed.
  That makes the graph assert a node does something it does not.
- **Do not add `alternativeTo`** between the existing nodes and the new one.
  Export-then-publish-then-serve are complementary steps, not competing arms, and
  that field's own note warns against deriving the relation from a shared skill.
  Exactly one pair in this instance is genuinely substitutable, `beans-cli` /
  `beans-manual`.

## Two reasons NOT to write `maintains`, both judgements rather than omissions

**`maintains.artefact` is a single path.** A generator that writes one file per
subject — `gen-skill-docs` (173 instruction bodies), `gen-schema-docs` (22
pages), `gen-block-jsonld` (one sibling per block) — has no single artefact to
name. A declaration naming one file out of tens is false in the way that is worse
than absent: **it looks like a complete provenance record.**

**A `maintains` claim asserts the artefact is published.** Verify that by reading
the build, not by assuming. `ns/vocabulary.jsonld` is a real claim because
`.github/workflows/docs-site.yml` writes it, and that was checked before the claim
was made. An artefact nobody publishes is exactly the 404 the drift check exists
to prevent.

### And the drift check only covers its own producer

`kg:schema:check` reconciles `maintains` both ways, but its `unproduced`
direction runs **only over artefacts whose declaring Tool invokes
`bun run kg:schema`**. It was narrowed on 2026-09-20 because it had encoded a
premise `maintains` never carried — that a maintained artefact is produced by the
schema exporter — and reported the first counterexample as drift.

So **a `maintains` claim on any other producer's artefact is unchecked.** It can
rot to a 404 and nothing notices. Bean `6f1x` carries the fix: assert every
declared artefact is present after `_site/` is assembled, with
could-not-determine kept distinct from present.

## Adding a Tool type is fail-closed, and that is deliberate

`check:tools` refuses a command-line input whose type could express a shell
payload, against the membership list in `schemas/tool-types.ts`. **A newly added
type is absent from that list and therefore unsafe by default.** Adding it is a
deliberate step, not an oversight to route around — and the fix for an enumerable
input is *the enum*, never a looser type that happens to pass.

Where the enum duplicates a union declared elsewhere, guard it in both
directions: `satisfies` catches a member that stops being valid, and a
conditional type catches a member added to the union and not here. An unavoidable
duplicate is fine; an unchecked one is not — see
[`directory-conventions`](directory-conventions.md).

## The third case: a mechanism with no skill at all

The two questions above have a third behind them, and it is invisible to both
instruments.

| case | what exists | what is missing | what sees it |
|---|---|---|---|
| 1 | a skill | a Tool | `check:tools`, `tools:coverage` |
| 2 | a skill **and** Tools for its neighbours | a Tool for the mechanism | nothing — this skill |
| 3 | a mechanism | **any skill stating the capability** | nothing |

Case 3 was met on 2026-09-20: `gen-themes-css` and `gen-avatars-css` render theme
and avatar nodes into `assets/css/themes.css` and `assets/css/avatars.css`. Both
are committed, published, single-file artefacts — a textbook `maintains` pair. And
**no skill in the corpus states the capability.** `kg-export` serializes the graph
to JSON; `rendering-auditor` audits a content block's visual output; neither is
"render the graph's asset nodes into the site's stylesheets".

`tools:coverage` cannot see this, and not by oversight: it enumerates **skills**
and asks which lack Tools. A capability nobody has stated generically is absent
from the list it walks — exactly as a command with no node was absent from what
`check:tools` could report.

### What to do, and what not to do

`satisfies` requires at least one skill, so a node cannot be written without one.
That constraint is load-bearing:

- **Do not stretch a neighbouring skill to make the node validate.** That is the
  same act this skill forbids above, committed from the other direction, and it
  is worse here because the resulting `satisfies` edge is simply false.
- **Do not write the skill as a wrapper for the command.** A skill states a
  capability generically; one that exists to give a script somewhere to point is
  a Tool with front matter.

Authoring the skill is a **design act** — a claim about the platform's capability
vocabulary — so it goes to the owner rather than being decided in passing. Bean
`yean` carries the two candidates and the argument for each.

Until it is settled, those scripts stay unreachable, and that is the honest state
rather than a gap papered over with a false edge.

## Reachability is PLURAL — "which caller should this have?" presumes one

The three cases above ask what is missing. This asks what shape the question has,
and getting it wrong wastes a round of proposals.

**The owner has stated this twice, in the same words both times.** Asked to choose
between three ways of reaching a mechanism: *"1 2 3 are all triggers"*, then *"all
for triggers or tools as appropriate"*. And a day earlier, asked which of three
mechanisms should start a CI watcher: *"kick off if like task or workflow initation
or bean roast"*. Both times the offered choice was refused, and both times the
answer was the same: **one mechanism, several dispatch points.**

So the question to ask is not *which caller should this have* but:

> **What should be able to start this — and is each of those a trigger or a Tool?**

The two are different objects, and which one a dispatch point is follows from who
initiates:

| dispatch point | it is a | because |
|---|---|---|
| a named command | **Tool** | a caller invokes it; that is what a Tool node IS |
| a BPMN activity | **trigger** | the process fires it when the step is reached |
| a QA sweep axis | **trigger** | the sweep fires it per subject |
| a schedule or a watcher | **trigger** | time or an event fires it |

`alternativeTo` stays **empty** across them, by the same argument
`ToolDefinitionSchema` makes about sharing a skill: these are not substitutable
arms, they are different ways the same work gets started.

### Enumerating the dispatch points is also how you find the ones already built

The value is not only completeness. Worked on `translation-roundtrip.ts`
(bean `vo9d`), where three dispatch points were proposed and, on reading the
mechanism, **two of the three were already done or wrong**:

- the BPMN trigger **already existed** — `Task_RoundTripQA` carried
  `<folio:skill ref="translation-manager"/>`, so `workflow_next` already handed an
  agent the skill at that step;
- a sweep axis was **wrong**, not merely awkward — the sweep cannot back-translate,
  and the verdict originates outside it;
- only the **Tool** was missing.

Presented as a choice, that is one proposal accepted and two wasted. Enumerated as
dispatch points, it is a three-line audit with one action.

### The failure underneath, which is worth naming on its own

Each wrong proposal came from the same move: **describing a mechanism from its name
and its position in a diagram, then reasoning about what it needs.** "Round-trip QA,
a `serviceTask` with no caller" generated three plausible options. The script's
usage string — `--payload <file.json>` — settled it in one line, because the
mechanism **records** a verdict agents produced rather than performing the check.

So before proposing dispatch points, read the mechanism's entry point. A name says
what something is for; an argument list says what it does.

## Why this is its own skill

It was written into [`skills-and-tools`](skills-and-tools.md) first, which took
that skill from 337 lines to 407 and turned its own `skill-is-brief` criterion
from a pass into a fail — *"At this length it is a document."* The audit was
right, and the remedy for a skill that has grown a second subject is to split it,
not to quiet the finding. Same move as the three-way split of `todo-manager`.
{% endraw %}
