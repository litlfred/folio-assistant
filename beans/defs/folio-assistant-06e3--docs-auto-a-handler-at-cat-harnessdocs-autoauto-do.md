---
# folio-assistant-06e3
title: 'docs-auto: a handler at cat-harness/docs-auto/<auto-doc-type>/<path> that derives documentation for a sub-graph — and the authoring rule that the author must summarise what it indexes'
status: todo
type: task
priority: normal
created_at: 2026-09-20T20:54:07Z
updated_at: 2026-09-20T21:12:03Z
parent: folio-assistant-0lmb
---


Owner, 2026-09-20 (session_014HGPQoUnzXGqSspA8x6YyD), in three messages.

## 1. The handler

> in cat-harness needs to be harness/handler at `cat-harness/docs-auto/<auto-doc-type>/<path>`
> defined. which will auto-generate extracatable documentation at `<path>` sub-graph.
> extracablle = bpmn, tasks, glossary, etc. ther is a glosarry bean... this could
> clarify it lives at `cat-harness/docs-auto/glossary/<path>`
>
> auto-doc-type = glossary, index, index/bpmm, index/dmn, index/skills,
> index/tasks index/processes index/roles etc.

One handler, parameterised twice: by **what kind of derived document** and by
**which sub-graph** to derive it over. `<path>` is a sub-graph, not a directory
listing — the point is that any node set can be asked for its glossary, its
process index, its role index.

**`toc` is OUT**, and this is the only place that says so. It was in the list
above and withdrawn in the same session: *"no toc,... ther is no meanging at
folio level/. (mayber later)"* — a table of contents is a document-order notion
and a folio has no single order to take one over. Written down because the next
agent reading the original list would otherwise re-add it.

## 2. The authoring rule — this is the half that is a SKILL, not a generator

> then when authong `<harness>/docs` the author should make use of auto-doc
> referneces and provide a summary / overvuew of each of the business processes
> defined. as part of skills and judgement

So `docs-auto` is deliberately **not** the whole documentation. It produces the
index; a human or agent authoring `<harness>/docs` **references** it and then
writes the thing an index structurally cannot contain — what each business
process is FOR, when you would be in it, and what it is not. That obligation is
a rule in a skill, checked by judgement, not a gate: an auto-generated index
with no prose around it reads as complete while explaining nothing.

## 3. Reuse, do not restate

> ..reuse assets in explain.

The summary **reuses the assets** — the rendered BPMN, the lane and activity
titles and descriptions, the skill descriptions the activities point at — rather
than paraphrasing them into a second copy that is free to drift. Same discipline
as `who-iris/docs/ingestion-notes.html` (54a2edc931), which renders the
requirements table out of `who-iris/skills/iris-dspace.md` instead of restating
it, and refuses rather than rendering an empty table when the source moves.

## Done when

- [ ] the handler exists and is declared, with the `auto-doc-type` set above and
      **no** `toc`
- [ ] **`who-iris/docs` is the first real exercise, end to end** — owner,
      2026-09-20: *"try it out fully w/ who-iris docs, auto-docs."* Not a
      fixture and not a smoke test: the instance that already has a hand-built
      `docs/` is the one that will show whether a derived index and an authored
      summary can sit in the same directory without fighting.
- [ ] the authoring rule lives in a skill with the reuse-not-restate clause
- [ ] `<harness>/docs` carries a per-process summary that references the derived
      index rather than duplicating it
- [ ] a stale or moved source makes the derivation FAIL, never render empty

## Not started — and the order is the owner's

Owner, 2026-09-20: *"after the other issues doen"*. This runs **after** the
three open who-iris items: the cover-image extraction, the IRIS-home mock
validated against the capture, and the CRDM KG-to-CDN work. Stated here so a
session picking this bean up does not start it early.

Queued. Related: `lqo9` (the glossary content kind + defined-terms index) is
pieces 2–4 of its own ask; piece 1 of it is one `auto-doc-type` served here.

## 4. What `<base-url>/<harness>/docs` must be, and what its navbar must hold

Owner, 2026-09-20, same session:

> when you are at `<base-url>/cat-harness/docs`, you see open i the main page the
> main/home/landing documentation page (QA every harness needs at least one
> meaningfully popualated doc page that outlines what the harness does/gives
> overview of main business porcess, roles, tasks, etc... .use docs-auto) you see
> documentation about cat-harness, but in the LHS navbar, there is index of all KG
> assets that have a docs/ with assets in it. (so you could see that who-iris has
> docs, but maybe not litlifred/qou... , they are all sub-harness docs. this
> should be common functionalty,)

Three requirements, and they are separable:

**(a) A landing page, per harness.** `<base-url>/<harness>/docs` opens that
harness's own home documentation page — what this harness does, with an
overview of its main business processes, roles and tasks. Built by
**referencing** the docs-auto indexes and writing the summary around them
(§2 and §3 above), not by pasting a generated index in.

**(b) A QA check with teeth: "at least one MEANINGFULLY POPULATED page".** The
adjective is the requirement. A landing page that exists and says nothing
passes a file-exists check and fails the reader, which is the `xom7` shape
again — *it looks exactly like a working one from in here*. So the check has
to be about content: does the page reference the harness's processes, roles
and tasks, and does it say something about them that the index does not?
**And it must report "could not determine" as a third state**, never as a
pass, per the CI-health and health-check rules this repo already keeps.

**(c) The LHS navbar indexes every KG asset that HAS a populated `docs/`.**
Not every declared `docs` directory — one *with assets in it*. So `who-iris`
appears and a dependency with an empty or absent `docs/` does not. That is
the "declare only what exists" rule (`dh4f`) applied to navigation: a nav
entry to an empty directory is a link that resolves to nothing while reading
as a section.

**This is common functionality, not who-iris's.** It belongs in the harness
layer beside `mount-instance-docs.ts`, which already resolves which instance
owns which route and already refuses collisions — the navbar is the same
question asked for a listing rather than for a mount, so the two must agree by
construction rather than by both being right.

Note the dependency direction: (c) needs nothing from docs-auto and could ship
first; (a) and (b) are what make docs-auto worth having, since an index with
no authored summary around it is the thing §2 exists to forbid.
