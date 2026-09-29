---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Placement'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/placement.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/placement.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/placement.md){: .fa-edit-source }

{% raw %}
# Placement — decide where it goes before you write it

**One question, answered before the first file exists:**

> **Which instance owns this, which of its declared graphs does it go in, and
> what kind of node is it?**

An agent that starts writing and works the answer out afterwards produces a
node in the wrong repository, under a hardcoded path, named by a composed
string. All three are silent: the tests pass, the build is green, and the
damage lands on the next consumer — usually a different folio, usually weeks
later. The worked failure at the end of this skill is one file that would have
destroyed the README of every folio except the one it was written for.

This is a **decision procedure**. Four steps and a stop. Run it in order; the
later steps are meaningless if an earlier one is a guess.

---

## Step 1 — which instance?

**`folio-assistant` is the platform, not the content.** It holds skills,
schemas, the pipeline and the MCP server an agent uses to author a *folio* — a
paper, a WHO SMART Guideline, an IG — and the folio lives in a **separate
repository**.

Ask of the thing you are about to write:

> **Does this name, assume, or default to one folio?**

A paper directory, a document title, a badge URL, an owner/repo, a Lake library
prefix, a workflow filename, a simulator path, a licence block, a vocabulary, a
constant with a subject-matter value. If the answer is yes, it does **not**
belong in platform code.

**There are three destinations, not two**, and collapsing the third is the
common mistake:

| destination | what goes there | test |
|---|---|---|
| **the platform** | the mechanism, parameterised | the same code is correct for every folio |
| **the folio's tree** | the subject matter itself | a reader of *that* folio would look for it |
| **the folio's config** | the value the mechanism reads | it varies per folio but platform code needs it |

A value that varies per folio and is consumed by platform code is a **config
field** — `<name>.config.json`, `<name>.json`, `lakefile.toml` — never a
literal in a script and never a file the platform has to go and find. The
simulator directory was the literal `folio-assistant/simulators` until it
became a config field; the Lake prefix was `QOU.` until it was read from
`lakefile.toml`, and is now left **unprefixed** when no lakefile names one,
because a wrong namespace is worse than none.

**Do not infer the instance from the directory you are standing in.** Read the
declaration at the repository root, carrying `name`, `stub` and
`directories`. `basename($PWD)` is not an identity — a repo cloned into a
differently-named directory resolves to nothing, and reports no config rather
than an error.

## Step 2 — which declared graph, and where does that instance put it?

**A node's location is not a path you memorise.** Every instance declares the
directories it scans in `<name>.json`, and each entry names the **kind of
graph** it holds — `cat-harness` (skills, roles, workflows, decisions,
requirements, permissions), `schemas`, `tools`, `qa`, `beans`, `folio` and the
rest. The vocabulary is open.

- **Ask for a skill, do not open a file.** `skill_list` for what exists here,
  `skill_fetch` to load one, `work_plan_prime` for the work plan. With no MCP,
  resolve the graph from the declaration (`readDeclaration` in
  `schemas/cat-harness.ts`) and read the directory it names.
- **In *this* repository the `cat-harness` graph's path is `skills/`.** That is
  a fact about this instance, not a convention you may carry to another one.
  Ids are stable across a relocation; paths are not.
- **Overrides match on the entry's `id`, never on its `path`.** An instance
  that sites its knowledge graph elsewhere redeclares the same id with a
  different path. Matching on path makes two knowledge graphs out of one
  relocation, and every consumer then scans a directory that is not there.
- **Declare only what exists.** A declared-but-absent directory is worse than
  an undeclared one: every consumer scans nothing and reports a clean run over
  it (bean `dh4f`, thirty pipeline scripts, three of them passing over a corpus
  they could not read).

Full rules, inheritance order and the three read states:
[`directory-conventions.md`](directory-conventions.md).

### The `docs` graph, and the filing question it answers

`docs` is an authorable destination like the others, and it is the one an agent
most often forgets to consider — measured 2026-09-21, when this agent derived
the destination list for a CRDM sign-off straight from the declaration and
still **omitted `docs`**, offering skill / proposal / nothing for a design
record that belonged in none of them. Deriving the list is not enough if the
derivation drops a declared graph.

**What goes there:** a **design-memory asset** — something produced while
BUILDING, rather than the thing built.
[`kg-contribution-offer`](kg-contribution-offer.md) carries the one question
that identifies the class and why `fsh-guts` is the tempting wrong answer
(its content may be thrown away; a design record's value is that it survives).

**WHOSE `docs/` comes first, and it is Step 1's question again.** Owner,
2026-09-21: *"if it is realated to some harness/feature/tool that detailed
infromation/design/planning/etc go into that harness' docs/"*. `docs` is a
declared graph, and the instance that owns the feature owns the record of why
it is shaped that way — measured the same day, `cat-harness/docs/` and
`who-iris/docs/` both exist and `who-iris` declares `docs` among its own
graphs. A feature's reasoning filed in the wrong instance's `docs/` reads fine
and is unreachable from the place that needs it.

**Then where inside it**, which is this skill's question and not
`kg-contribution-offer`'s:

| the asset is | it files under |
|---|---|
| why a subsystem is shaped as it is — requirements, options, rulings | `<instance>/docs/architecture/`, with `parent: Architecture` in the front matter |
| options for a decision not yet taken, with what each costs | `<instance>/docs/proposals/`, `kind: proposal`, and a row in its `index.md` |
| what was FOUND — prior art, a survey, a measurement, a comparison — that informs a decision without proposing one | `<instance>/docs/research-and-analysis/`, `kind: research`, and a row in its `index.md` |
| how a person does a task with it | `<instance>/docs/guides/` |
| how to REACH a data source the content describes — endpoints, shapes, quirks | `<instance>/docs/`, beside the subject it serves |
| what a declared thing IS, generated from source | `<instance>/docs/reference/` — **never hand-edited** |

Three rules that catch the usual mistakes:

1. **A design record is dated and says what it was true OF.** It is history, so
   it carries the commit, PR or issue it describes. A record written in the
   present tense becomes a claim about today, and goes stale invisibly — the
   `8nzu` failure, where a dated observation read as current guidance.
2. **It states what it could NOT establish.** A requirement referenced but never
   defined, a measurement not taken: named as such. A design record that reads
   complete when it is not is worse than a short one.
3. **It is prose for a person, not instructions for an agent.** If you find
   yourself writing *"the agent SHALL"*, it is a skill and it is in the wrong
   graph.

**The line between the two, stated as a test** — the owner's, 2026-09-21:

> **A skill carries what a competent practitioner needs IN ORDER TO DO the
> task. Anything beyond that is documentation.**

Background, derivations, options not taken, an API's full surface when the task
touches three calls: real, worth keeping, and none of it needed to act. Both
directions fail silently — a skill that swallows them makes every agent read a
chapter to find a rule, and a rule filed in `docs/` because it arrived with
context is a rule `skill_fetch` will never serve.

### The inheritance gap — know it before you rely on it

An instance is supposed to **inherit its dependencies' directories and skills**,
deepest dependency first and root last so the root wins. For directories that
works: `declarationChain` + `resolveDirectories` are wired.

**For skills it does not.** `resolveSkillDirs` in `schemas/harness-config.ts`
computes the cross-instance skill overlay and **has no caller**, so skill
discovery is **root-only in practice today** and a dependency's skills are not
yet reachable. Outstanding Phase 0.1 work.

What that means for placement, concretely: **a skill you put in the platform
intending a downstream folio to pick it up will not reach that folio yet.** If
the folio needs it now, that is a reason to say so and ask — not a reason to
copy the skill into the folio, which mints a second copy free to drift.

## Step 3 — which KIND of node?

The axes below are distinct, and each pair has been conflated at least once at
real cost. Ask the separating question; do not pattern-match on what the thing
resembles.

| you are about to write | ask | the two answers |
|---|---|---|
| a new content type | does it need different **code**, or only different **rules**? | different code → an **adapter**; only rules → a **profile** plus a subclass |
| something a participant is or does | must the performer **know** it, or may the participant **do** it? | know → a **skill**, on the lane's role; do → a **permission**, on the actor |
| a participant | does it persist across processes, or is it a position inside one? | persists → an **actor**; a position → a **role**, which is the BPMN swimlane |
| a sequence of steps | does it have actors, activities and a control flow? | yes → **BPMN** under the workflows directory, not a Mermaid fence and not prose |
| a branch at a gateway | is the answer **computed from facts**, or chosen by a person? | computed → a **DMN** table plus a `<cat-harness.processes:decision/>` ref; chosen → an ordinary gateway |
| a durable fact for one agent | does it **govern**, or **summarise** what governs? | governs → a **skill**; summarises → a memory entry under the memory nodes |
| subject matter | would a reader of one folio look for it? | yes → the **folio**, as data — never the platform |

**Adapter vs profile is the expensive one.** Adapters (`paper`, `dak`)
partition block kinds into **disjoint** namespaces, and `adapterForKind` — what
QA-criterion scoping reads — must stay **total and unambiguous**. Profiles
(`document`, `paper`) **nest**: every document kind is also a paper kind.
Making `document` a third adapter would have made `adapterForKind` ambiguous on
all **eight** shared kinds.

**Actor / role / skill / permission is the one with a measured cost.** One
sentence carries the model — *an actor performs a task in a process as a role,
using that role's skills* — and moving permissions onto Role, which looks right,
produced **36 conflicts** where a permission was held by some but not all actors
sharing a role. Resolution rules, how to bind a lane, and how to add a role:
[`role-model.md`](role-model.md). Do not re-derive them here.

**A `.md` under the `cat-harness` path that declares its own `$schema` is not a
skill.** The audit walks that directory recursively; declaration beats location,
the same contract `part-of:` carries.

**Adding a *graph kind* is a registry change, not a new top-level directory.**
If nothing in the open vocabulary fits, that is a decision to hand over
(Step 5), not one to settle by creating a folder.

## Step 4 — which stub? There are two, and they are unrelated

This is the step most often skipped, because "stub" reads as one word.

### The agent-file stub — a pointer, never a home

`AGENTS.md` is the agent-generic source of truth. `CLAUDE.md` and `GEMINI.md`
are **thin stubs whose entire content is a pointer to it**; `scripts/init-folio.ts`
writes all three for a new folio.

- **Never put guidance in a stub.** It reaches one tool's agents and nobody
  else, and the other two stubs are then quietly wrong.
- **And prefer not to put it in `AGENTS.md` either.** That file's own banner
  says it: it is a bootstrap pointer, and *the discipline lives in the skills
  graph*. A rule that exists only in `AGENTS.md` is not in the generated
  reference, not in the published skill docs, and not found by an agent that
  went looking for the skill first. The turn-report discipline lived there
  alone until it was moved.

So: **new guidance is a skill.** Add a pointer from `AGENTS.md` if it needs
one, and register the skill in its package manifest.

### The artefact stub — resolve it, never compose it

The declaration carries `stub`, the filename stem of **every artefact this
instance publishes**. `artefactStub()` is the one function that answers it
(`stub` when declared, otherwise `name`), and `renderingPath()` / `siteDir()`
derive the published paths from it:

```
<base>/<stub>.jsonld     <base>/<stub>.json
<base>/<stub>.schema.json     <base>/<stub>/     docs/<stub>/
```

**Compose nothing; resolve everything.** The knowledge-graph tile in the site
navbar was hand-written as `/kg/` and **404'd from the day it was added** —
nothing has ever been published there, because the real path comes out of
`renderingPath`. It is the same defect as the contents table that built every
PDF cell by convention: all twenty-three chapter links were 404 and always had
been, and three of six appendix links happened to resolve, which is why nobody
noticed.

**A naive guess is not merely fragile, it is wrong on real instances.** WHO's
`smart-base` publishes under the stub `base`, so "the stub is the repo name"
fails on the reference implementation the convention was modelled on.

**The declaration file itself is deliberately NOT stub-named.** A consumer
bootstrapping into a repository it knows nothing about needs **one fixed
filename to open first**; everything that file describes is free to be named
after the instance, because by the time you fetch those you have read the
declaration that names them.

## Step 5 — when you cannot tell, stop and ask

Placement has **three** states, like everything else here: **determined**,
**determined-empty** (this instance genuinely has no such directory — a real
answer), and **could-not-determine**. The third is never to be rendered as the
first.

**Do not guess and do not pick the repository you happen to be standing in.**
A misplaced node is not a typo: it is a second copy of something, free to
drift, that a later agent will find and believe.

Hand the decision over the way
[`interaction-modality.md` §4.1](interaction-modality.md) requires — context →
options **with what each costs** → your recommendation, marked → what happens
if they say nothing → the question. The test is one pass:

> **Can the reader answer without opening anything?**

Every identifier expanded on first use. A link is where somebody goes for
*more*; it is never where the terms are defined.

```
I need to place <thing>, which <one sentence on what it does>.

Two candidates:
  A. <instance/graph> — costs <what this makes harder, concretely>
  B. <instance/graph> — costs <…>

Recommend B, because <the property that decides it>.
If you say nothing I will do B and note it in the PR body.

A or B?
```

## The worked failure this skill exists to prevent

`scripts/generate-readme.sh` lived in the **platform** and ended in
`cp "$OUT" README.md`. It held one folio's content: the title
`# Quantum Observable Universe`, three `litlfred/qou` badges, a Knot Registry
of Alexander-Briggs indices, a Project Structure table naming that folio's Lean
directory, and a CC BY 4.0 licence block. **Run it in any other folio and the
author loses their README.** Only five of its sections were derived from the
tree at all; the rest was prose, and prose about a folio belongs to that folio.

It also resolved its own helpers against the folio root, so it could only run
from a platform checkout — which has no papers. Every step above would have
caught it: Step 1, the title and the badges name one folio; Step 2, the helper
path was composed rather than resolved; Step 4, the published paths were built
by convention and checked against nothing.

The replacement inverts the ownership — a registry of sections, each written
**only** where the README already carries its marker pair, and a section that
cannot read its source returns `skip` and leaves the region exactly as it was.
The folio owns the file; the platform owns the markers. `AGENTS.md`
§"README sections" is the full post-mortem.

## Checklist

Before you create a skill, role, actor, workflow, decision, schema, tool or
content object:

1. **Instance** — platform, folio, or the folio's config? Does anything in it
   name one folio?
2. **Graph** — which declared entry, resolved from `<name>.json` by **id**?
   Not a path you remember.
3. **Kind** — which side of the separating question in Step 3, and can you say
   why in one sentence?
4. **Stub** — if it is guidance, is it a skill rather than a stub or
   `AGENTS.md`? If it publishes, does every path come from `artefactStub()` /
   `renderingPath()`?
5. **Registered** — package manifest updated, and `bun run scripts/gen-skill-docs.ts`
   run, so the published mirror is not stale.
6. **Could not determine?** Stop. Ask in the Step 5 frame. Do not default to
   the repo you are in.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [CRDM Phase 5 — beans and sign-off](../../processes/crdm-signoff.html) | Run placement, and raise a bean for the authoring |

