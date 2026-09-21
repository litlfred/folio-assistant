---
layout: default
title: The platform — actors, roles, processes, skills
lang: en
description: "What the platform does, and how its processes, roles, tasks and skills fit together."
nav_exclude: true
---

<!--
  AUTHORED, and flat under `docs/` like every other authored page here. It
  lived at `/cat-harness/` until 2026-09-21, as the one authored file in a
  namespace whose every other route is a generator's output at
  `<handler>/<kind>/`. The owner settled that collision — THE HANDLER WINS
  (bean `8h42`) — so the namespace is generated material only, and this page
  moved out.

  Moving it also ends the two-pages-one-stem collision rather than containing
  it: `docs/index.md` and `docs/cat-harness/index.md` shared the stem `index`,
  and `resolvePoSources` finding a block-level PO by bare stem wrote five
  locales of "translation-coverage: fail, 2%" about a page nobody had ever
  translated (PR #691). That was contained by making a PO claim its subject
  through its own gettext `#:` references. Now there is one `index`.

  This page is the one a person writes, and bean `06e3` §2 is why it exists at
  all: an index says what there is, and nothing else. What a process is FOR,
  when you would be in it, and what it is not, has to be written by somebody.

  TWO RULES THIS PAGE IS UNDER, both from `06e3`:

  1. REFERENCE the indexes, never restate them. If a sentence here could be
     produced by reading a generated page, delete it — a second copy is free
     to drift from the first, and the reader cannot tell which is current.
  2. NO COUNTS IN PROSE. The indexes carry live counts because they are
     regenerated; a number typed here is wrong the next time somebody adds a
     diagram, and nothing checks it. Link, and let the index say how many.

  `nav_exclude` is deliberate: the left-hand navbar's structure is bean `603s`,
  in flight in another session, and a nav entry added here would collide with
  the section model it is building. So REACHABILITY COMES FROM A LINK instead
  — the Home page points here. Measured 2026-09-21, before that link existed:
  no page in this site linked to this one, and the comment here claimed it was
  "reachable by its route and from the links that point at it". Zero links is
  not "the links that point at it", and a page reachable only by typing its
  URL is a page nobody reads.
-->

# The platform
{: .fs-9 }

The platform half of folio-assistant: the skills, schemas, processes and MCP
server an agent uses to author a folio. **It holds no subject matter.** A paper,
a WHO SMART Guideline, an Implementation Guide — those live in their own
repositories and instances, and this one is the machinery they run on.
{: .fs-6 .fw-300 }

---

## One sentence, and every word in it is a declared object

> **An actor performs a task in a process as a role, using that role's skills.**

That sentence is the whole model, and the five nouns are five different things
that are easy to collapse into each other:

| | what it is | why it is not the one next to it |
|---|---|---|
| **Actor** | a concrete participant — a person, an agent session, a scheduled job | persists across processes; a role does not |
| **Role** | the BPMN **swimlane** — a persona an actor takes on for the duration of a lane | nobody *is* a reviewer; somebody **acts as** one, here, now |
| **Task** | one activity in one diagram | the unit of work, not the ability to do it |
| **Process** | the diagram itself: lanes bind roles, activities name skills, gateways may compute a branch | the shape of the work, not an instance of it |
| **Skill** | the instructions the actor needs to perform the task | knowledge, not permission — what an actor *may do* is a permission, and it lives on the actor |

The full argument, including why moving permissions onto Role produced
thirty-six conflicts, is in the
[`role-model`]({{ '/reference/skill-instructions/role-model.html' | relative_url }}) skill.

## Processes — every one is BPMN, and the diagrams are executable

A process here is not a picture of a workflow drawn after the fact. The `.bpmn`
file **is** the source of truth: `workflow_start`, `workflow_next`,
`workflow_gate` and `workflow_complete` run it, `workflow_complete` refuses a
step that holds no token, and the running instance is committed so a sibling
session sees the same position. A diagram that disagreed with what the tools do
would be a defect in the diagram.

**Entry point or step inside another — the distinction is derived, not
labelled.** A process that no other diagram *calls* is somewhere work begins:
you enter it deliberately. A process named by a `callActivity` somewhere else is
a step inside that larger one, and entering it directly means starting in the
middle of something. Nothing marks this in the file; it falls out of who calls
whom, which is why it stays true as diagrams are added.

Three things worth knowing before you open one:

- **A lane is an accountability boundary.** When a token crosses into another
  lane, who is answerable for the next step changes — that is the point of
  drawing it, and why "say which process you are in" is a rule rather than a
  courtesy.
- **An activity names the skill that performs it.** So a process is also a map
  of which skills matter for which work, and a step whose skill is missing is a
  finding rather than a blank.
- **A gateway may be computed.** Where a branch is backed by a DMN table, the
  agent supplies the *facts* and the table returns the branch. A
  hand-supplied outcome is refused, so nobody talks their way past a gate.

**[Every process, with its lanes, its activities and the skills they name →]({{ '/cat-harness/docs-auto/index/processes/' | relative_url }})**
That index is generated from the diagrams on every build, so it is what the
repository actually contains rather than what this page remembers.

## Roles, tasks and skills

Skills are knowledge-graph content, not a directory to memorise. An agent asks
for one — `skill_list` for what exists, `skill_fetch` for a named skill's
instructions — and an instance **inherits** its dependencies' skills through
the same declaration, so what is reachable depends on where you are standing.

**[Every skill, by sub-graph →]({{ '/cat-harness/docs-auto/index/skills/' | relative_url }})**

Roles are declared in `scenarios/roles.json` and bound to lanes by the
diagrams; permissions are declared on the **actor**, because what somebody may
do cross-cuts the lanes they act in. `bun run kg:audit` checks one criterion
per join between them and writes its findings as committed sidecars rather than
as console output — a printed verdict is gone, which makes "unbound since it
was drawn" and "broken in the commit under review" indistinguishable.

## What the handler publishes, and why it is not here

`/cat-harness/` is a **handler namespace**, not a section of this page. Every
route under it is `<base>/<handler>/<kind>/` — the platform rendering one
declared graph — and the handler segment is read from the instance's declared
`name`, never composed.

This page used to sit at `/cat-harness/` as the one authored file among them.
Two path rules meet there: `<base>/<handler>/<kind>/` is the machinery
rendering something, and `<base>/<instance>/` is an instance presenting
itself. The platform is both, so the rules collided at exactly that path, and
the owner settled it on 2026-09-21 — **the handler wins**. Bean `8h42`.

| | what it shows | generated by |
|---|---|---|
| [docs-auto]({{ '/cat-harness/docs-auto/' | relative_url }}) | derived indexes over a sub-graph — [processes]({{ '/cat-harness/docs-auto/index/processes/' | relative_url }}) and [skills]({{ '/cat-harness/docs-auto/index/skills/' | relative_url }}) | `gen-docs-auto.ts` |
| [library]({{ '/cat-harness/library/' | relative_url }}) | the L1 corpus: what is ingested, how far, what references it, and what is still queued | `gen-library-viz.ts` |
| [schemas]({{ '/cat-harness/schemas/' | relative_url }}) | the schema graph — declarations and the edges between them | `gen-schema-viz.ts` |
| [voices]({{ '/cat-harness/voices/' | relative_url }}) | every voice an instance declares, and the passage each rule was read from | `gen-voices-viz.ts` |

The table is the four that exist, read from the sibling directories rather
than remembered — it named three for a day after the fourth landed.

<!--
  `docs-auto` was named here WITHOUT a link for one commit, because
  `/cat-harness/docs-auto/` and `/cat-harness/docs-auto/index/` had no index
  page — the same defect this page fixes one level up, found by checking the
  links rather than assuming they resolved. `gen-docs-auto.ts` now writes a
  level index at every level above a built type, so the link is back.
-->

Each is regenerated from the tree it describes, so a stale one is a build
problem rather than an editing problem. **This page is the opposite**: nothing
regenerates it, and it goes stale silently if the thing it describes moves. If
you change how processes, roles or skills relate to each other, change it here
too — that is the cost of the half an index cannot write.

## Where to go next

- [Getting started]({{ '/getting-started.html' | relative_url }}) — the first five minutes
- [Agentic harness]({{ '/agentic-harness.html' | relative_url }}) — the agent–user interaction model, idle and workflow states
- [Publication workflow]({{ '/publication-workflow.html' | relative_url }}) — the normative picture of the review and publish path
- [Beans and todos]({{ '/beans-and-todos.html' | relative_url }}) — the work plan, and why it is committed
- [CRDM]({{ '/crdm-methodology.html' | relative_url }}) — what happens when a request is a feature request rather than content work
