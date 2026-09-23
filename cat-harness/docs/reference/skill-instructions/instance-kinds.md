---
layout: default
title: 'Instance kinds'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/instance-kinds.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/instance-kinds.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/instance-kinds.md){: .fa-edit-source }

{% raw %}
# Instance kinds — naming one, and what a new kind must declare

Two different things are called a "kind" here, and a reader who conflates them
adds the wrong one:

| | what it is | where it is declared |
|---|---|---|
| **instance kind** | what a repository *is* — `cat-harness`, `bootstrap`, `who-iris`. It has a name, a prefix family, a `<name>.json`, and files it inherits from whatever it was bootstrapped off | a `<name>.json` at the instance root |
| **graph kind** | what a declared DIRECTORY holds — `tools`, `docs`, `beans`, `library`. A value in the graph-kind registry, with `renderable`, `holds` and a summary | `defaultGraphKinds` in `schemas/cat-harness.ts`, or a registration from a layer that owns it |

An instance kind gets a **name**. A graph kind gets a **declaration**. This
skill covers both, and §"Most new things are not a new graph kind" first,
because that is the question people get wrong.

---

## Most new things are not a new graph kind

**Before adding a value to the registry, answer this:**

> Is there a NODE SHAPE here that no existing kind describes — or is there a
> new thing you want to DO with nodes that already have a kind?

A new verb is not a new kind. Only a new noun is.

### The worked example, and it is the one this skill was written for

Three beans (`jbx2`, `v1hw`, and whatever `docs/` and `folio/` get) ask for
**visualisers**, and the bean that commissioned this skill assumed a
`visualiser` graph kind would be needed — that it would be *"the first kind
where the answer is not obvious: it RENDERS, and what it renders is another
graph's content rather than its own."*

Measured 2026-09-21, the question does not arise:

- **`coverage.visualiser` is a rendered PATH, not a kind.** Every value in the
  corpus has the shape `cat-harness/docs/cat-harness/<graph>/<instance>/index.html`.
  It names an artefact, the way `coverage.docs` names a page.
- **The owner's own placement rule says Tool.** `v1hw`: *"the visualiser lives
  as a tool in the harness that DEFINES the schema, declared in
  `skills`/`tools`."* Not beside the data, and not in whichever layer happens
  to render it.

So a visualiser is a **Tool node** in the existing `tools` graph that emits a
**page** in the existing `docs` or `folio` graph. Two kinds that already exist,
composed. Nothing to register.

**Why this is worth a section rather than a sentence.** A registry value is
cheap to add and expensive to remove: every consumer that switches on a kind
gains a case, `check:graph-kind-work` gains a row, and the JSON-LD vocabulary
gains a term that downstream instances inherit whether or not they ever hold
one. The failure is silent — nothing breaks, the vocabulary just stops meaning
anything, because a kind that describes an activity rather than a shape cannot
tell a consumer what it will find in the directory.

### When it genuinely IS a new kind

All three, not a majority:

1. **A directory will hold it.** A kind is what a declared directory holds. If
   nothing gets declared, there is no kind — you have a file format.
2. **A consumer must branch on it.** Something reads the directory and would
   behave wrongly if it treated the contents as an existing kind.
3. **You can answer `renderable` and `holds` without hedging.** See below. If
   either answer is *"it depends what it is used for"*, the shape is not
   settled and the kind is premature.

---

## Naming an instance — the prefix families

A prefix names the **layer** or the **owner** an instance belongs to.

| prefix | what it marks | instances here |
|---|---|---|
| `cat-` | the agentic-harness layer | `cat-harness`, `bootstrap`, `bootstrap-tools` |
| `folio-assistant-` | the content/core layer | `folio-assistant-core`, `folio-assistant-sci` |
| `who-` | WHO material | `who-iris`, `who-style-guide` |
| `litlfred-` | the owner's own | — none yet |

**Four of the eleven instances here carry no prefix at all** — `agent-skills`,
`detangle`, `kg-navigation`, `large-datasets` (measured 2026-09-21,
`findDeclarationFile` over each directory). That is the state of the corpus, not a backlog: an
unprefixed name is undecided, not wrong, and this skill does not make it a
finding. Do not sweep them into a family to make the table tidy; a rename is
the one act with consequences that cannot be undone later (§"And the owner may
decline the convention").

**The `cat-` prefix reaches the harness layer and stops there.** It does not
extend to `folio-assistant-*`. That ruling settled a live merge conflict —
`main` had renamed the core instance `folio-assist-core` while a branch carried
`folio-assistant-core` — which is why it is written down rather than left to be
re-derived.

### The default is to keep the kind's name

A new instance of a kind **inherits that kind's name** unless somebody chooses
otherwise. That is the default, not the rule.

### And the owner may decline the convention

`qou` would be `litlfred-qou` or `folio-assistant-qou` by the table above, and
it is neither, by the owner's decision.

> **Do not "fix" `qou`.** It is the worked example of a documented override,
> not an instance that was missed. The same goes for `folio-assist-sci`, which
> has never been raised — a name that does not match the table is a decision
> until somebody says otherwise, and renaming an instance changes what every
> artefact written into it inherits, which is the one thing that cannot be
> fixed later (`bootstrap/README.md`, §2).

A skill that presented the convention as mandatory would have renamed `qou`.
A default with a documented override is a different thing from a rule, and the
difference is the whole content of this section.

---

## What a new graph kind must declare

The shape is `GraphKindDef` in `schemas/cat-harness.ts`. Read it there for the
authoritative field list; what follows is what an author has to *decide*.

| field | required | the question |
|---|---|---|
| `type` | yes | the `@type` IRI it projects to — `termIri("SomethingGraph")` |
| `renderable` | yes | does a graph of this kind become a website? |
| `holds` | yes | what does a running process do with it? |
| `recordsWork` | for `state` kinds | is this something somebody is partway through, that an arriving agent could pick up? |
| `summary` | yes | one paragraph a consumer can act on |
| `skill` | optional, and absent means absent | which skill says how to READ it |

### `holds` has FOUR values, not three

`content` · `context` · `state` · `derived`.

| value | a running process… | example |
|---|---|---|
| `content` | PRODUCES it; it is the subject | `schemas`, `docs`, `cat-harness` |
| `context` | READS it and never writes it — a step that writes is a **defect** | `memory`, `interaction` |
| `state` | WRITES it as it runs | `beans`, `workflow-state` |
| `derived` | produces it **from a source**, and would regenerate rather than re-author it | `library` |

`derived` is the newest and the one most often missed: it was added 2026-09-20
(bean `hqku`) when `library/` turned out to be neither content nor context —
*not* `context`, because `document-ingestion.bpmn` writes it and `context`
makes that a defect; *not* `content`, because a QA finding against a derived
section is a finding against its **generator**, and sends a reviewer to the
wrong file.

**There is no "could not determine" on this axis, and that is deliberate.** A
third state is right when a CHECK looked and could not tell, and wrong when an
AUTHOR is registering a kind they are defining. Whoever adds a kind knows what
a process does with it. The full classification of every existing kind, with
its reason, and the two supporting questions for a hard case, are in
[`content-context-and-state-graphs`](content-context-and-state-graphs.md).

### `recordsWork` is narrower than `holds: "state"`

It asks whether the graph records **work somebody is partway through**, not
merely whether something writes to it. The distinction was measured rather than
assumed: reading it as "declares any state graph" made the repository root and
`who-iris` ACTIVE on `uploads` alone, and an ingestion queue is live state that
nobody is partway through. An agent told *"this KG is active"* on that basis
arrives looking for something to prioritise and finds unprocessed files.

`check:graph-kind-work` requires it for every `state` kind, so a new state kind
cannot ship undecided.

---

## Where a kind may live — a layer owns the kinds it can render

Two kinds in this repository are renderable, and they live in different places
for a reason worth copying.

| kind | declared where | why |
|---|---|---|
| `folio` | **registered by core**, on import (`schemas/folio-graph-kind.ts`) | the harness cannot serve it — block viewers, LaTeX, QA badges, translation overlays |
| `docs` | **in the harness's own table** (`defaultGraphKinds`) | the harness ships a plain just-the-docs renderer and can serve it |

The rule in its true form is **a layer owns the kinds it can render** — not
"the harness owns no renderable kind", which was the earlier phrasing and
stopped being true the day the harness shipped a renderer.

**Registration on import is for a kind that may legitimately be ABSENT.** A
first attempt registered `docs` on import too, mirroring `folio`, so that the
sentence *"the harness's own vocabulary contains no renderable kind"* could stay
literally true. That preserved a sentence at the cost of the design: `folio` is
CONTRIBUTED by a dependency and may not be there, whereas `docs` ships with the
harness and can never be absent — twenty consumers would have needed an import
for a kind that is always present. The test was updated instead. **That is what
it means for a premise to have changed rather than for a principle to have been
broken**, and it is the check to run on your own new kind: *can this kind be
absent?* If no, it belongs in the table.

**The boundary `docs` must not cross** is the SUBJECT, not the feature list.
The moment a `docs` page needs a block viewer, a LaTeX pass, a QA badge or a
translation overlay, it is describing authored CONTENT and is a `folio`.

---

## What a new instance inherits, and which of it is yours to edit

A new instance kind is bootstrapped from an existing one, and it arrives
carrying that instance's files. Some of them are **yours**, and nothing
currently tells a new owner which.

### `bootstrap/README.md` is the first one

It is the page a Bootstrapping Agent reads before it knows anything — *"you have been
pointed at a repository, you know nothing about it"* — and it is written for
**this** repository. Measured 2026-09-21: it resolves **13 links into
`../cat-harness/`**, across **6 distinct files**:

| target | links |
|---|---|
| `../cat-harness/schemas/dak-blocks.ts` | 5 |
| `../cat-harness/schemas/role-graph.ts` | 3 |
| `../cat-harness/schemas/cat-harness.ts` | 2 |
| `../cat-harness/schemas/skill-package.ts` | 1 |
| `../cat-harness/schemas/tool.ts` | 1 |
| `../cat-harness/processes` | 1 |

Every one of those is a **term definition** — what a role is, what a DAK block
is, what a harness declaration is. Bootstrap a new instance kind that is not
built on `cat-harness` and its first reader gets a page whose every definition
points into a harness they are not using.

**So repointing it is expected, not a modification of platform code.** Point
the links at whatever layer defines *your* vocabulary, or at your own
instance kind's schemas. Keep the user-scenario structure — persona, user
scenario, business process, functional requirement — because that is the
formalism the page is written in and the bootstrap process reads it; change
only where the terms resolve.

> **This is the general shape, not a special case.** Any inherited file whose
> content is a POINTER — a README, an `AGENTS.md` stub, a `.mcp.json`, a
> builder shim — belongs to the new owner. Any inherited file that is a
> MECHANISM belongs to the layer that ships it, and changing it there is a
> platform change with all the gates that implies.

---

## Before you push

| what you changed | run |
|---|---|
| added a graph kind | `bun run check:graph-kind-work`, `bun run check:harness-dirs` |
| added or renamed an instance | `bun run check:instance-config`, `bun run check:subgraph-coverage` |
| edited this or any skill | `bun run check:skills` |
| anything | `bun run gates` |

`bun run gates` is the one to run, and it is stronger than "a list someone
maintains" in two distinct ways worth knowing before you trust it (bean `j2w4`):

1. **Its gate list is derived**, from `.github/workflows/code-quality-gates.yml`,
   so it cannot drift from that workflow.
2. **Every OTHER workflow is scanned too**, and any `bun` step CI runs that the
   local set does not is reported on every run — unless it carries a declared
   exemption with a **reason** (`covered-by`, `ci-only`, `no-folio`). *"It is
   slow"* and *"it usually passes"* are not reasons.

The second half is what makes the first safe to rely on, and it was added
because a CI failure went red on a gate the local runner had just passed. A
hand-picked subset of the gate set is not the gate set.

## Related

- [`harness-requirements`](harness-requirements.md) — what an instance OWES for
  every directory it declares. This skill is how to make one; that one is what
  it then owes.
- [`content-context-and-state-graphs`](content-context-and-state-graphs.md) —
  the `holds` axis in full, with every existing kind classified and its reason.
- [`directory-conventions`](directory-conventions.md) — the declaration schema,
  path resolution, and the dot-prefix guard.
{% endraw %}
