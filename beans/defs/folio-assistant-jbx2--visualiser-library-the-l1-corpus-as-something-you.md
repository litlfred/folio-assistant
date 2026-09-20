---
# folio-assistant-jbx2
title: 'VISUALISER: library/ — the L1 corpus as something you can look at'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T14:01:05Z
updated_at: 2026-09-20T18:50:45Z
parent: folio-assistant-yj32
---


Owner, 2026-09-20: *"we also need library/ harness visualation"*, and
*"bean up to do: library/ visualaiont. the fsh-gts/ has visualion beaned up
already/in-progress."*

## Why this one first among the missing viewers

`library/` is L1 — every knowledge-graph reference to a source resolves THROUGH
it, never to a loose path or a bare URL. So it is the subgraph whose contents
most consumers depend on, and the one nobody can currently look at. Its sibling
`uploads/` is the queue feeding it, and the two are deliberately separate
declarations precisely because a source sitting in `uploads/` "reads as absent
to every consumer while the file is on disk" — a distinction a viewer should
make visible rather than leave to prose.

## What it has to show, from what is actually there

A `library/<bib-slug>/` holds `sections/*.md`, `structure.json`, and — where the
source was scanned — `ocr/page-NNN.txt`. So the honest view is per slug:

- what the source IS (title, the declaration that named it),
- how far ingestion got (sections? structure? OCR, or none because it was never
  scanned — which is a third state, not a failure),
- what REFERENCES it, since resolving through `library/` is the whole point,
- and what is in `uploads/` that has NOT become a slug yet, which is the queue
  the corpus checklist cannot see.

## Related, deliberately not merged into this

`fsh-guts/` already has a visualisation beaned and in progress — a different
subgraph with a different shape (the trashcan, where `movedFrom` is the field
that earns its keep). Sharing a renderer between them is a decision for whoever
builds the second one, not an assumption for the first.

## Done when

- [ ] `library/` renders per slug, with ingestion state as THREE states rather
      than a tick or a cross.
- [ ] `uploads/` entries that have not become slugs are visible as such.
- [ ] It resolves at least one real reference through a slug, so the "everything
      resolves through here" property is demonstrated rather than asserted.

## A quick upload+process action, on THIS visualiser — owner, 2026-09-20

> bean up also to add a quick upload+process icon/funciton in libary/
> visualtion to start doc ingest

So the `library/` visualiser is **not read-only**: it carries an affordance
that takes a file and starts document ingest in one action, from the place a
person is already looking at the corpus.

**Why it belongs here rather than only on `v1hw`.** `v1hw` is the `uploads/`
visualiser — the QUEUE, and its own upload path. This is the same capability
reached from the other end: somebody looking at the L1 corpus notices a gap
and wants the document in it, without first learning that `uploads/` exists as
a staging area. The queue is an implementation detail from this view.

**Two things that follow, and neither is cosmetic:**

1. **It must not become a second ingest path.** "Upload + process" starts the
   SAME pipeline `slw1` defines; if it grows its own shortcut, a document
   ingested from here and one ingested from the queue end up different, and
   the difference is invisible afterwards. It is a trigger, not a pipeline.
2. **It shares the write mechanism with `v1hw`**, so it inherits the same
   unanswered question from `yj32`: git is confirmed as the store, and which
   write path — forge API, local server, or a commit from a checkout — is the
   owner's call. Two visualisers must not answer it twice.

The ingest it starts is also what makes the uningested badge on `v1hw` tick
down, which is the other reason these two are one design: the action here
changes the number there.


---

## Reuse the folio visualisations, read-only, plus materialise-into-a-folio — owner, 2026-09-20

Verbatim, because it settles both what to build and what NOT to build:

> also bean about library asset visualtion. work on that too. reususe existing
> (or planned) folio visuzations, just on that subgraph w/o edit functionality.
> just materialize/duplicate into choice of folio

Three separate instructions, and the middle one is a constraint rather than a
feature.

### 1. Reuse, do not invent

The renderer is the **folio** one — existing or planned — pointed at the
`library/` subgraph. Not a second viewer built beside it. That is the same rule
`v1hw` states for placement (*the visualiser lives as a tool in the harness
that DEFINES the schema*) applied to the renderer instead of the location: one
rendering path, several subgraphs, rather than one bespoke page per directory.
It is also what keeps `2krx`'s 19 unrendered subgraphs from becoming 19
bespoke pages.

**Measured 2026-09-20, so "reuse the existing one" is checked rather than
assumed:** the only generated viewer in the repository today is
`scripts/kg-viewer.ts` — one HTML file, no CDN, no framework, data fetched
relative to its own location, a faceted index with a detail panel and a
one-hop neighbourhood diagram. The folio board (`6lb8`) is *planned*, not
built; `.fa-landing-board` renders one card per instance and `mountTodoBoard`
mounts inside it. So "existing or planned" resolves to: **kg-viewer's shape is
what exists, the board is what is planned**, and this bean should not be the
thing that decides between them — `yj32` owns that.

### 2. WITHOUT edit functionality — and this narrows the bean

This retracts nothing above it, but it does re-scope the write half. The
`library/` view is **read-only on the assets it shows**. The "quick
upload+process" affordance recorded earlier in this bean is a *trigger for
ingestion*, not editing of an asset, so it survives — but nothing in this view
edits a `sections/*.md`, a `structure.json` or an `ocr/page-NNN.txt`.

That is worth having in writing because it **decouples this bean from the
unanswered write-path question on `yj32`**. A read-only view of `library/`
plus a materialise action (below) can ship before anyone decides between a
forge API, a local server and a commit from a checkout. The upload affordance
still waits on that; the rest does not.

### 3. Materialise / duplicate into a folio of choice

The one action the view carries: take an asset from `library/` and
**materialise (duplicate) it into a chosen folio**. Duplicate, not move and not
reference — the L1 entry stays where it is, and the folio gets its own copy.

Four things this needs that the read-only half does not, none of them decided:

- **Which folios are offerable?** The instances this checkout can see, from the
  declarations — not a typed path. "Resolve, do not compose."
- **What is the unit?** A whole `<bib-slug>/`, or one `sections/*.md`? The
  honest default is the slug, because a section detached from its
  `structure.json` is the shape `library/` exists to prevent.
- **Where does it land in the target?** That folio's own `library/`, or its
  `uploads/`? Landing in `uploads/` would make it re-ingestable and would tick
  `v1hw`'s badge; landing in `library/` claims an ingestion that did not
  happen. **`uploads/` is the defensible default** and it should be argued
  explicitly rather than chosen quietly.
- **It is a WRITE.** Read-only-on-assets does not make the bean read-only:
  materialising writes into another instance. So the write-path question
  returns here, scoped to one operation instead of to a whole editing surface —
  which is a much smaller thing to decide.

### What this does not change

`jbx2` still owns the three-state ingestion display and the
resolves-through-a-slug demonstration. The additions here are the renderer
constraint (reuse), the scope cut (no asset editing) and one new action
(materialise), not a replacement of the bean above.

## Done when — additions

- [ ] The view is the folio renderer pointed at `library/`, not a second
      bespoke page; which renderer is inherited from `yj32` rather than decided
      here.
- [ ] No affordance in the view edits a library asset.
- [ ] Materialise duplicates a chosen unit into a chosen folio, with the target
      directory argued rather than assumed, and the source left untouched.
- [ ] The folio choice is resolved from declarations, never composed from a
      path literal.

---

Tracked on [issue #582](https://github.com/litlfred/folio-assistant/issues/582).


---

## Sortable listing + folio/desktop view — owner, 2026-09-20

> work on library visualation too. need (srotable) lisiting (w/ metadata) and
> folio/desktop view

Two views, and the reason there are two rather than one is that they answer
different questions:

- **Listing** — every column sortable, every metadatum visible. This is what
  answers *"which is biggest"*, *"which has no OCR"*, *"which came from which
  upload"*. Sorted state is a reader's question, so it is interaction and not
  a stored preference.
- **Desktop** — the corpus as tiles, the folio/Miro-board metaphor `yj32`
  describes. This is what answers *"what is in here"* before you know what you
  are looking for.

**They are two renderings of ONE projection, not two pages.** A reader who
filters in the listing and switches to the desktop is looking at the same set.
Two pages would be two answers to "what is in the corpus", free to disagree.

## BUILT — 2026-09-20

`scripts/library-graph.ts` (reader) + `scripts/gen-library-viz.ts`
(projection + viewer), the same three-piece shape `xgd8` used for `schemas/`
and `km90` used for `beans/`: one reader, one published projection under the
instance's rendered-content root, one zero-dependency viewer that fetches it
relative to its own location. The published segment is the DECLARED
directory's own name, so a rename moves the source and the URL together.

Gated by `library:viz:check`, falsified both directions.

### The three-state ingestion display, which was this bean's requirement

OCR is the case that forces it, and the viewer renders three different things,
**none styled as an error**:

| state | meaning |
|---|---|
| `not scanned` | no `ocr/` at all — a DETERMINED answer, not a failure |
| `N OCR pages` | scanned |
| `ocr/ present, empty` | a third answer again, and the one worth looking at |

Measured: `who-pub-tps-931` has 121 OCR pages; the other three have no `ocr/`
directory. Rendering those three as "0" would have said OCR failed on them.

### Resolving through a slug is demonstrated, not asserted

The third "done when" item asked for at least one real reference resolved
through a slug. The viewer does better: **every** entry's source is resolved
back to the `uploads/` file it was ingested from, by name AND by recomputed
sha256 — four of four match. That refutes `v1hw`'s stated blocker, and the
detail is recorded there.

### What is deliberately absent

No affordance edits a library asset — the owner's *"w/o edit functionality"*,
and it is what let this ship before `yj32`'s write-path question is answered.
The upload+process trigger and materialise-into-a-folio are writes and are
not in this code.

## Done when — revised

- [x] `library/` renders per slug, with ingestion state as THREE states
- [x] `uploads/` entries that have not become slugs are visible as such
- [x] At least one real reference resolved through a slug — four of four, hash-verified
- [x] Sortable listing with metadata, and a folio/desktop view, over one projection
- [ ] Materialise/duplicate into a chosen folio (a WRITE — `yj32`)
- [ ] Quick upload+process trigger (a WRITE — `yj32`, shared with `v1hw`)
