---
layout: default
title: Content graphs and state graphs
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/content-and-state-graphs.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/content-and-state-graphs.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/content-and-state-graphs.md){: .fa-edit-source }

{% raw %}
# Content graphs and state graphs

An instance declares directories, and each says what **kind** of graph it
holds. Until 2026-09-20 a kind answered one question — does this render as a
website — and a consumer had no way to tell the subject matter from a record
about it. This is the second axis.

> **`content`** — authored nodes a reader or a tool consumes as the subject
> matter. It is what the instance **IS**.
>
> **`state`** — a record of where a process, a participant or an artefact
> **GOT TO**. It **references** content and is meaningless without it.

It is `holds` on `GraphKindDef` in `schemas/cat-harness.ts`, and it is
**required**: `tsc` refuses a kind that has not said.

## The two questions

Reach for these rather than for the directory's name. Both are about the
graph's contents, not about who wrote them or how often they change.

**1. Does it stand on its own?** Detach a node from everything else in the
repository. A skill still instructs, a schema still constrains, a library
section still reads. A bean names work on something that is no longer there; a
QA verdict judges an absent subject; a workflow instance holds a token in a
process drawn elsewhere. **If detaching it empties it, it is state.**

**2. Would you regenerate it or re-author it?** Content is written and revised
by somebody with an intention. State is *arrived at* — it is what running
something produced, and re-running is how you would get it back. A `.po`
catalogue is authored; a health report is arrived at.

The questions agree in every case in this repository. Where they disagree,
say so rather than picking: a kind that stands alone AND is arrived at is a
shape this axis has not met, and inventing an answer for it is how a
vocabulary acquires a category nobody can use.

## The classification

Ask the code, not this table — `graphKindsOfLayer("state")` returns the live
answer and this page cannot go stale against it. **No count is given here on
purpose**: a count in prose is a claim nothing checks, and this repository has
corrected two of them.

What is worth writing down is the **reasoning for the four that are not
obvious**. The rest are obvious in both directions and are recorded in the
table itself.

**`qa` is state.** A verdict is where a *review* got to on a subject that
lives elsewhere. It fails question 1 outright — detached from the artefact it
judges it asserts nothing about anything. This is also why the `kg-qa/` tree
**mirrors** each subject's path rather than being flat: a verdict's identity is
partly the thing it is about.

**`health` is state.** The same shape one level out. `qa` asks whether the
artefacts pass; `health` asks about the repository itself — how large the
clone has grown, how much of the publish branch the previews occupy. Both are
evidence *about* an instance, never part of it.

**`uploads` is state, and `library` is content.** This pair is the clearest
demonstration that the axis is not about file type: the same PDF is state in
one directory and content in the other. `uploads/` is a **queue**, and a queue
is a position in a pipeline. The declaration already says these files are not
L1 and read as absent to every corpus consumer — the file is on disk and the
content does not exist yet. `library/` is what ingestion produced, and every
knowledge-graph reference to a source resolves through it.

**`fsh-guts` is state, and it is the one that reads like content.** It holds
structured material that *could* be rendered — that is what makes it the hard
case — and the fact it actually carries is **where something got to**:
abandoned, superseded, decided against. That is why it is deliberately absent
from the rendered site while being renderable in principle, and it is the sense
in which "delete means relocate here" is reversible. Classified by the owner,
2026-09-20; both questions agree.

## What a consumer may assume

**Of a content graph**, that a node means what it says without further lookup,
and that two instances holding the same node hold the same thing.

**Of a state graph**, neither. A state node is *about* something, so a
consumer must resolve the reference before reporting on it, and the same node
in two instances is two different records. A state graph is also the one that
can be **stale**: content is wrong or right, state is wrong, right, or about a
version that has moved on.

**Of an unregistered kind, nothing.** `graphLayer()` returns `undefined`, and
`isContentGraph` / `isStateGraph` are deliberately **not** each other's
negation. Reading an absence as `content` is how somebody asking for a skill
gets handed a QA verdict.

## Adding a kind

Answer the two questions and write the answer in `holds`, with the reason
beside it as a comment. Two rules about how, and both are about not creating a
second answer:

**Do not add a third value.** "Could not determine" is right when a *check*
looked and could not tell, and wrong when an *author* is registering a kind
they are defining. Whoever adds a kind knows what it holds; declining to say
moves the burden to every consumer, which is the position this axis exists to
end.

**`holds` is part of a kind's identity.** `sameKind` in `cat-harness.ts`
compares `type`, `renderable` and `holds`, so two layers registering one name
on opposite sides of the line is a conflict that throws rather than a diamond
where the first registration silently wins. `summary`, `skill` and `schema` are
descriptive and are not compared — a dependency wording its summary
differently is not a conflict.

## Two things this axis is NOT

**It is not `renderable`.** The two are independent. Everything renderable so
far is content, and nothing about state forbids a future kind being rendered —
`fsh-guts` is the near miss, renderable in principle and withheld on purpose.

**It is not a ruling on a graph's contents.** Classifying `cat-harness` as
content says what that *kind* holds. Whether a particular node inside it is on
the right side is a separate question, and one of them is open:
`skills/memory/` holds agent-memory nodes inside `cat-harness` — a content
kind — while their human mirror `todos/` is state. The 2×2 that
`harness.json` states on `todos/` (memory vs workflow management, human vs
agent) does not settle it, because `todos/` is labelled *memory* and holds
**outstanding items**, which is workflow-management-shaped, while a memory
entry is an **established fact**. So the content/state line may cut *across*
that 2×2 rather than aligning with it. Bean `mhh9`, and the answer changes
where 36 nodes live. **Do not decide it in passing.**

## See also

- [`directory-conventions`](directory-conventions.md) — what a declaration is
  and how a path resolves. This page is the axis; that one is the mechanism.
- [`process-state`](process-state.md) and
  [`bpmn-processes`](bpmn-processes.md) — the largest consumer of a state
  graph: a workflow instance is a token's position in a diagram that lives in
  a content graph.
- [`todo-manager`](todo-manager.md) and
  [`bean-coordination`](bean-coordination.md) — the work plan, and why a bean
  is never deleted. A state record that vanishes leaves a sibling unable to
  tell abandonment from accident.
{% endraw %}
