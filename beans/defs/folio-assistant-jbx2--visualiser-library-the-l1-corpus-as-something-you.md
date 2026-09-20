---
# folio-assistant-jbx2
title: 'VISUALISER: library/ — the L1 corpus as something you can look at'
status: todo
type: task
created_at: 2026-09-20T14:01:05Z
updated_at: 2026-09-20T14:01:05Z
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
