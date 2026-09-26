---
layout: default
title: 'docs-auto'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/docs-auto.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/docs-auto.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/docs-auto.md){: .fa-edit-source }

{% raw %}
# docs-auto — the index is generated, the meaning is authored

`<base>/<handler>/docs-auto/<auto-doc-type>/<sub-graph>/` is an index of what
exists. **It is not the documentation, and the gap between those two is the
whole reason this skill exists.**

Owner, 2026-09-20, bean `06e3`, in three messages:

> in cat-harness needs to be harness/handler at
> `cat-harness/docs-auto/<auto-doc-type>/<path>` defined. which will
> auto-generate extracatable documentation at `<path>` sub-graph.

> then when authong `<harness>/docs` the author should make use of auto-doc
> referneces and provide a summary / overvuew of each of the business
> processes defined. as part of skills and judgement

> ..reuse assets in explain.

Three statements, and only the first is a generator.

## The obligation: reference the index, then say what it cannot

`bun run docs:auto` emits, per artefact, what that artefact **declares about
itself** — a skill's front-matter description, a process's own
`<bpmn:documentation>`, its lanes, the skills its activities name. That is a
complete answer to *what exists* and no answer at all to:

- what this process is **for**, and when you would be in it;
- what it is **not**, and which neighbouring process you actually want;
- why it has the lanes it has, and what changes when you cross one;
- which of them a newcomer should read first.

**An index with no authored prose around it reads as complete while explaining
nothing.** That is the `xom7` shape — *it looks exactly like a working one from
in here* — moved into documentation, and it is the failure this skill is
written against.

So when you author `<harness>/docs`, for each business process the index
lists, write the paragraph the index cannot contain. Judgement, not a gate.

## Reuse the assets; never restate them

> *"..reuse assets in explain."*

The summary **links to and embeds** the derived entries — the rendered BPMN,
the lane and activity names, the skill descriptions the activities point at.
It does not paraphrase them into a second copy, because a second copy is free
to drift and the copy a reader finds first is the one with no generator behind
it.

The worked example in this repository is
[`who-iris/docs/ingestion-notes.html`](https://github.com/litlfred/folio-assistant/blob/main/who-iris/docs/ingestion-notes.html):
its requirements table is **parsed out of** `who-iris/skills/iris-dspace.md`
rather than typed beside it, and it **refuses rather than rendering an empty
table** when the source moves. Do that, not a transcription.

## What the handler emits, and what it does not

**Read the type list off `TYPES` in `gen-docs-auto.ts`, not off this table.**
The table below was wrong on two rows until 2026-09-24 — it called `glossary`
unbuilt while it was emitting pages, and omitted `index/docs` entirely — which
is the failure this skill's own §Related points at `uses-editorial-review` for.

| | |
|---|---|
| built | `index/skills`, `index/docs`, `index/processes`, `glossary` — four declarations in `gen-docs-auto.ts`, each emitting under `docs-auto/` |
| declared, **not** built | `index`, `index/bpmn`, `index/dmn`, `index/tasks`, `index/roles` |
| **withdrawn** | `toc` |

**`glossary` moved rows, and `lqo9` has not been told.** It was listed here as
*"gated by bean `lqo9`'s roast"*. That roast was held on 2026-09-20 and the
type now builds — `docs-auto/glossary/` carries an `index.html` and a
`glossary/` subtree. Bean `lqo9` is still open and still carries the gating as
a live constraint on its own remaining work, so a reader arriving from either
side is told the glossary index is blocked on something that has been
overtaken. Whoever next works `lqo9` should re-scope it against what is
actually emitting.

**`toc` is out and stays out.** Owner: *"no toc,... ther is no meanging at
folio level/. (mayber later)"* — a table of contents is a document-order
notion and a sub-graph has no single order to take one over.

**Unbuilt types are absent, not stubbed.** A type that emits an empty page is
indistinguishable from one whose sub-graphs happen to be empty, and the second
is a fact while the first is an unfinished feature.

## Two rules the generator keeps, and why they are not incidental

**A type names the GRAPH KIND its artefacts live in.** The first draft walked
every declared directory and reported **1,522** skills where `knownSkills()`
finds 219 — `docs/` is declared too, and holds a generated markdown rendering
of every skill, so each was counted again as a second skill. *A rendering of an
artefact is not the artefact.*

**Ask the repository's own function; do not re-derive its rule.** The second
draft walked the skill directories recursively and reported 227 against 219.
All seven extras were `skills/<package>/<skill>/<page>.md` — supporting pages
*inside* a skill, which carry the same front matter and are not skills.
`skillMdDirs()` already encodes that distinction, so the generator calls it.
Two answers to "what is a skill" is one answer too many.

## The sub-graph segment is the declared `id`, not its path

The owner wrote `<path>`; the URL carries the declared entry's **`id`**.
Deliberate, and the reasons are `state-visualizer`'s own: `id` is what
`<name>.json` declares and what an override matches on, so an id-derived URL
**survives the directory moving**. It also stays one segment, which is what
lets `orphanSubjectPages()` prune with an exact ownership test rather than a
fourth pruner (bean `ankg` asks for no more of those). Each page **states its
declared path**, so nothing is lost — the mapping lives on the artefact rather
than only in the URL.

## An empty sub-graph gets no page

A sub-graph contributing nothing to a type is not rendered. A declared-but-
empty directory with a page claiming to index it is the `dh4f` defect as a nav
entry: a link that resolves to nothing while reading as a section.

The corollary is that a page **disappearing** is normal, so the generator
prunes its own orphans through `ankg`'s helper — ownership read off the page's
own `var SCOPE` line, never assumed from the directory.

## Related

- [`readme-sections`](readme-sections.md) — the same split one level out: the
  platform owns the markers, the folio owns the file.
- [`uses-editorial-review`](uses-editorial-review.md) — why a count in prose is
  a claim rather than evidence, which is why these pages compute their counts.
- Bean `06e3` — the handler, the authoring rule, the per-harness docs landing
  page and its QA check, and the navbar over harnesses with populated `docs/`.
  **Their states differ and are worth naming separately**, because this entry
  said "the last two are not built" until 2026-09-24 and one of them was
  gating CI at the time:
  - the **QA check** is **built and gated** — `check:docs-populated`
    (`package.json`, run by `code-quality-gates.yml`);
  - the **landing page** is **not built**. `06e3` records one at
    `cat-harness/docs/cat-harness/index.md`; there is no such file, and
    `<base>/cat-harness/` is served by `published-graphs.md`, which is
    GENERATED. So §"The obligation" above is **unmet** for that route rather
    than satisfied — an index with no authored prose around it is exactly what
    this skill exists to refuse;
  - the **navbar** is **not built**.
{% endraw %}
