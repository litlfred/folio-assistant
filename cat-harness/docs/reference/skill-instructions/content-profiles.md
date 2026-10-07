---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Content types'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring/authoring-core/content-profiles.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring/authoring-core/content-profiles.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring/authoring-core/content-profiles.md){: .fa-edit-source data-fa-link="edit" data-src="cat-harness/skills/authoring/authoring-core/content-profiles.md" data-repo="litlfred/folio-assistant" }

{% raw %}
# Content types — `document` is the base, a paper extends it

A **document** folio is structured prose: policy guidance, a standard, a report.
A **paper** is that plus the block kinds whose assertion is a formal
mathematical claim, backed by machine-checkable siblings and typeset through a
TeX pipeline.

**That relation is encoded, not merely described.** The paper adapter *extends*
the document adapter, and every block kind is a `folio-block-kind/v1` node
whose **required** `profile` field says which side it is on: `paper` for a
mathematical claim, `document` otherwise. A two-valued required field is what
makes the classification total by construction rather than by review — a kind
whose author did not choose does not parse.

**No module lists the kinds.** They are DISCOVERED from the `block-kinds/`
graphs their owning harnesses declare — the document kinds in
folio-assistant-core, the math kinds in folio-assistant-sci (owner,
2026-10-04: *"kinds need to be discoverable … not centrally managed"*; bean
riit). Adding a kind is adding a node to the harness that owns it; the
`BLOCK_KINDS`, `MATH_BLOCK_KINDS` and `DOCUMENT_BLOCK_KINDS` values in
`schemas/block-kinds.ts` are computed from the nodes.

## Two axes, and conflating them is the costly mistake

| | what it does | how they relate |
|---|---|---|
| **Adapter** | partitions block kinds into **disjoint** namespaces | `adapterForKind` must stay **total and unambiguous** — it is what QA criterion scoping reads |
| **Profile** | says what a folio may **contain** | profiles **nest**: every document kind is also a paper kind |

**They pull in opposite directions, which is why the distinction is load-bearing
rather than tidy.** Adapters must not overlap; profiles must. Making `document`
a third *adapter* would have made `adapterForKind` **ambiguous on every kind the
two share** — eight of them, measured when the question was live — and a
scoping function that returns two answers cannot fail an audit, because nothing
can say which answer was meant.

**The question to ask when you add a content type:**

> Does it need different **code**, or only different **rules**?

If only rules, it is **a profile plus a subclass**, not an adapter. Reaching for
a new adapter is the expensive answer and usually the wrong one.

**The instance that ships a content adapter declares it; the harness never
names it.** `contentAdapters` in that instance's `<instance>.json` —
`contentType`, instance-relative `module`, `className`, and `extends` for the
type it specialises — is what `src/builtin-adapters.ts` discovers. `extends`
orders the fallback: the specialisation leads, because falling back *to* a
superset loses nothing and falling back *from* it loses its tools. The harness
held `../<instance>/adapters/…` paths until 2026-09-30, a variable import no
static gate could see and the edge that kept it from lifting into its own
repository; `check:import-direction` now fails on that shape (bean `p11x`).

## What profile enforcement catches that schema validation cannot

A profile check runs on every validation, and it exists because the gap it
covers is **structural, not an oversight**:

- **A block kind is valid in isolation.** A `theorem` is a well-formed
  `theorem` whatever folio it sits in — the type says nothing about whether
  *this* folio may contain one.
- **The constraint layer cannot read the folio's configuration.** Which profile
  is active is an instance fact; the schema is a shared artefact. So the check
  has to live between them.

Two rules follow, and the second is subtler than it looks:

1. **The kind must be within the active profile.**
2. **In a document profile, no formal-proof field and no machine-checkable
   sibling** — because several kinds *declare* that field as optional. The
   **type permits what the profile forbids**, which is exactly the case schema
   validation cannot express and a reviewer will not notice.

## The render path a document profile actually uses takes no TeX

A document folio assembles to one Markdown file and goes through a
document-converter toolchain; the PDF comes from an HTML-to-PDF engine.

**It never falls back to the TeX pipeline, deliberately.** A PDF that silently
came out of LaTeX would misreport what the folio needs in order to build, and
the next person on a clean machine pays for that — they install a toolchain the
folio's own output implied was required, or discover the reverse at the worst
moment.

It is registered for **both** content types on purpose: it is the render that
works while drafting on a machine with no TeX, which is most machines most of
the time.

## A normative statement is not a block kind

There is deliberately **no `recommendation` kind**. A normative statement is
carried by a labelled, titled prose block.

**Adding a real kind is about thirty files** — a builder, a schema, a label
prefix, viewer registration, constraint rows and QA criteria — so it is tracked
as its own work rather than half-done. A kind that exists in the type system and
nowhere else is worse than no kind at all: it validates, renders as nothing, and
is invisible to every audit.

**Known wrong, and left visible rather than quietly patched:** intake guidance
that maps guideline recommendations onto `definition` predates the document
profile and is wrong for a document folio, where `definition`'s formal field is
required.
{% endraw %}
