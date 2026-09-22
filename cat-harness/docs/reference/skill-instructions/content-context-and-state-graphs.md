---
layout: default
title: 'Content, context and state graphs'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/content-context-and-state-graphs.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/content-context-and-state-graphs.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/content-context-and-state-graphs.md){: .fa-edit-source }

{% raw %}
# Content, context and state graphs

An instance declares directories, and each says what **kind** of graph it
holds. Until 2026-09-20 a kind answered one question — does this render as a
website — and a consumer had no way to tell the subject matter from a record
about it, or a record it may write from one it may not.

## One question settles every kind

> **Does a running process WRITE it, READ it, or is it the SUBJECT?**

| layer | the process… | example |
|---|---|---|
| **`content`** | produces it — that is usually the point | a skill, a schema, a folio chapter |
| **`context`** | **reads it and never writes it**. Static for the duration of an instance; it changes only when a human directs an authoring act, outside any process | an agent-memory entry |
| **`state`** | **writes it as it runs** — a bean's status changes because a step completed | a bean, a workflow instance, a QA verdict |
| **`derived`** | produces it **from a source**, and would regenerate it rather than re-author it. Not the working corpus | a `library/` section |

**`content`'s example used to be "a library section" and that was wrong** —
see §"The case that added `derived`" below. It is a folio chapter now.

It is `holds` on `GraphKindDef` in `schemas/cat-harness.ts`, and it is
**required**: `tsc` refuses a kind that has not said.

**A step that writes to a `context` graph is a defect, not an update.** That is
the whole reason the layer exists, and it is what a consumer could not
previously ask.

## Two supporting questions, for a hard case

The one above decides almost everything. When it does not, these two do, and
they have agreed with each other in every case here.

**Does it stand on its own?** Detach a node from everything else. A skill still
instructs, a schema still constrains, a library section still reads. A bean
names work on something that is no longer there; a QA verdict judges an absent
subject. **If detaching it empties it, it is not content.**

(A library section passes this and is still not `content` — standing on its own
rules out `state`, not `derived`. The section below is that case.)

**Would you regenerate it or re-author it?** Content and context are *written*
by somebody with an intention. Live state is *arrived at* — re-running is how
you would get it back. A `.po` catalogue is authored; a health report is
arrived at.

Where they disagree with each other, **say so rather than picking**: a shape
this axis has not met is how a vocabulary acquires a category nobody can use.

## The classification

Ask the code, not this page — `graphKindsOfLayer("context")` returns the live
answer. **No count appears here on purpose**: a count in prose is a claim
nothing checks, and this repository has corrected two of them.

What is worth writing down is the reasoning for the kinds that are **not
obvious from their name**.

**`memory` is `context`, and it is the kind the third layer was added for.**
The owner, settling bean `mhh9`, 2026-09-20:

> *put memory under state/context as static, during a process. it does not
> change. agents dont work on it (except when an authoring agent is directed by
> human). todos, beans are not static*

Every clause of that is the definition. A process **reads** memory; no step
writes it. It changes when a human directs an authoring agent, which is an act
**outside** any instance.

**`todos` is `state`, and that is the pair worth understanding.**
`todos/todos.json` states a 2×2 — memory vs workflow management, human vs agent
— and puts `todos/` and agent memory in the same *memory* row. **This axis cuts
across that row.** A todo is an **outstanding item** a process closes; a memory
entry is an **established fact** nothing mid-process revises. Same row of that
2×2, opposite sides of this line. Neither model is wrong; they are asking
different questions, and a reader who assumes they align will expect memory to
behave like a todo.

**`fsh-guts` is `context`, and it is the one that reads like content.** It
holds structured material that *could* be rendered — which is what makes it
hard — and the fact it carries is *where something got to*: abandoned,
superseded, decided against. But **no running step writes it**. Relocating
something there is a human-directed act, and
[`deletion-requires-confirmation`](deletion-requires-confirmation.md) is the
skill that says so in as many words. Read, never written by a process. It was
`state` for the few hours between the axis landing and `mhh9` being settled,
and the refinement moved it by the same criterion that moved memory.

**`qa` and `health` are `state`.** A verdict is where a *review* got to, and
the sweep that produced it writes it. `health` is the same shape one level
out — about the repository rather than its artefacts. Both fail the
stand-alone question outright: detached from what they judge, they assert
nothing. This is also why the `kg-qa/` tree **mirrors** each subject's path
rather than being flat — a verdict's identity is partly the thing it is about.

**`uploads` is `state` and `library` is `content`.** The clearest proof the
axis is not about file type: the same PDF is state in one directory and content
in the other. `uploads/` is a queue, and ingestion writes and drains it; the
declaration already says these files are not L1 and read as absent to every
corpus consumer. `library/` is what ingestion produced.

## What a consumer may assume

| | content | context | state |
|---|---|---|---|
| means what it says without resolving a reference | yes | no | no |
| a step may write it | no — authoring writes content, and that is the subject of a governed process, not bookkeeping | **no — a write is a defect** | yes |
| can be stale | it is wrong or right | yes — against a codebase that moved on | yes |
| same node in two instances is the same thing | yes | no | no |

**Of an unregistered kind, nothing.** `graphLayer()` returns `undefined`, and
the three predicates are deliberately **not** each other's negations. Reading
an absence as `content` is how somebody asking for a skill gets handed a QA
verdict.

**Use `processMayWrite()` rather than `=== "state"`.** It is the question
`isStateGraph` is usually being asked in service of, and naming it means a
fourth layer is one edit rather than a search.

## Adding a kind

Answer the question and write the answer in `holds`, with the reason beside it
as a comment. Three rules about how:

**Do not add a value without a case that needs it.** `context` arrived because
`content` and `state` alone forced two unlike things together — a bean, which a
step rewrites, and a memory entry, which no step may touch — and a consumer
told only "this is state" could not tell whether writing to it was normal or a
bug. That is the bar: a real consumer that cannot answer a real question.

**There is no "could not determine".** A third state is right when a *check*
looked and could not tell, and wrong when an *author* is registering a kind
they are defining. Declining to say moves the burden to every consumer, which
is the position this axis exists to end.

**`holds` is part of a kind's identity.** `sameKind` compares `type`,
`renderable` and `holds`, so two layers registering one name on different
layers is a conflict that throws rather than a diamond where the first silently
wins. `summary`, `skill` and `schema` are descriptive and are not compared.

## The case that added `derived` — `library/`, 2026-09-20

The fourth layer exists because the two supporting questions **disagreed**, and
the instruction above is to say so rather than pick. This is what saying so
looked like.

Owner, 2026-09-20: *"library is static (only if we materialize assets or
not)"* and *"can duplicate asset into a folio and work there."* Bean `hqku`.

| question | answer for a `library/` section |
|---|---|
| does a process write it? | **yes** — `document-ingestion.bpmn` |
| does it stand on its own? | **yes** — a section still reads. Says `content` |
| regenerate, or re-author? | **regenerate**, from the ingested source. Says not-content |

Both candidate answers were wrong, and each was ruled out by a rule rather
than by taste:

- **`context` is ruled out** because it carries *"a step that writes to it is a
  defect, not an update"* — and a declared process writes `library/`. Choosing
  it would have made `document-ingestion` a defect by this axis's own rule.
- **`content` is ruled out** by the sweep rule, *"qa-sweep is only on
  active/working content"* (owner, same day). A QA finding against a derived
  section is a finding against its **generator**, so a sweep that judges
  `library/` sends a reviewer to fix the wrong file.

What `derived` buys, concretely: `walkBlocks` skips a directory whose declared
graphs are all non-`content`, so `library/` leaves the sweep **with no
directory name written down anywhere** — the same way `fsh-guts/` did. A
hardcoded skip would have been the alternative, and a hardcoded path is what
this declaration exists to remove.

**What it does NOT mean.** `derived` is not "unimportant" and not "not
committed". `library/` is L1 corpus, committed and greppable, and every
knowledge-graph reference to a source still resolves through it. The layer says
where a *finding* belongs, not what the material is worth.

## Classifying a kind is not a ruling on a directory's contents

`cat-harness` is correctly `content`. For a few hours on 2026-09-20,
`skills/memory/` sat inside a `cat-harness` directory and held `context`.
**Both were true at once**, and that is the case that shows why the two
questions are separate: classifying a kind says what that KIND holds, not what
every node beneath a directory of that kind is.

The nodes have since moved to their own declared `memory/` graph (bean
`07xs`), as their own change — relocating a directory as a side effect of
adding a classification is the shape #395 refused and bean `auap` did
separately. So the example is now history rather than a live gap, and it is
kept because the rule it illustrates is not: **a directory of one kind may
contain a node of another, and the containing declaration is not a claim about
its contents.**

## A declared ASSET carries a layer too

The axis is not only about directories. `instance-readme` and
`agent-instructions` are declared assets, and both hold **`context`** — the
owner's own words on issue #592: *"its static content at process runtime and
treated as an asset like memories"*. `README.md` and `AGENTS.md` are read at
session start and authored by a human, so a step that rewrites one is a defect
by the same rule a step writing to `memory/` is.

**One rule, not two spellings.** `layerIsWritable(layer)` is the whole of it;
`processMayWrite(kind)` and `processMayWriteAsset(role)` both call it. They
were nearly written as two `=== "state"` comparisons, which is how a `context`
directory and a `context` asset come to mean different things the day a fourth
layer is added — and the word stops carrying a rule the moment that is
possible.

**Where an asset's layer is declared is the one difference.** A directory's
layer is a property of its graph KIND; an asset's is a property of its ROLE,
in `ASSET_ROLES`, because an asset has no kind. A per-asset `layer` would be
eleven instances answering one question, and `check:asset-roles` rejects it —
asked of the raw declaration, since `KgAssetSchema` strips an unknown key
without a word.

**Creation at INITIALISATION is not a process write.** A `context` asset that
does not exist yet has to come from somewhere, and bootstrap writing one when
it is absent is not the write this rule forbids: **initialisation is not
process runtime.** The rule governs a process operating on an instance that
exists; initialisation is the act that brings one into being, so *"never
written by a process"* cannot mean *"never created"* without leaving every
instance without one.

That is not hypothetical. `initialize-harness.bpmn` ends with
`A_WriteRootReadme`, whose skill (`bootstrap/skills/root-readme.md`) writes
the root `README.md` when there is none — an `instance-readme`, which is
`context`. It **never replaces** one that exists: an existing README is
authored content, and the link and install status go in a marker pair the
harness's `readme_sync` owns from then on. Bean `7sfm`.

Where this page and that skill disagree, **this page wins** and the skill is
the copy that drifted — it says so itself.

## See also

- [`directory-conventions`](directory-conventions.md) — what a declaration is
  and how a path resolves. This page is the axis; that one is the mechanism.
- [`agent-memory`](agent-memory.md) — what a memory entry promises, and the
  injection budget. This page says what layer it is on.
- [`process-state`](../workflow/process-state.md), [`bpmn-processes`](../workflow/bpmn-processes.md) —
  the largest writer of a live-state graph: a workflow instance is a token's
  position in a diagram that lives in a content graph.
- [`todo-manager`](todo-manager.md), [`bean-coordination`](bean-coordination.md)
  — the work plan, and why a bean is never deleted. A state record that
  vanishes leaves a sibling unable to tell abandonment from accident.
{% endraw %}
