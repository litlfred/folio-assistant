---
# folio-assistant-q7ey
title: 'UPLOADS RETENTION: nothing removes an ingested upload, and a library entry may not hold its source — two decisions, not a tidy-up'
status: todo
type: task
created_at: 2026-09-29T23:26:27Z
updated_at: 2026-09-29T23:26:27Z
parent: folio-assistant-2upx
---

Owner, 2026-09-29, while the decision-methodology sources were being ingested:
*"why are ingested things still sitting in uploads and not moived to library of
appropraite harness?"*

## Measured before answering, 2026-09-29

Fourteen library entries across the platform, compared against `uploads/` by
each manifest's own `meta.source_file`:

| | |
|---|---|
| upload still in `uploads/` | **9** |
| upload gone | **5** |

The split is not random. **All five that are gone are the ones with a
hand-chosen descriptive filename** — `feng-2023-designing-with-language`,
`neubauer-2025-ai-assisted-schema-creation`,
`dusengumuremyi-2026-ai-mediated-raci`, `gurel-tat-2017-swot-analysis`,
`sammut-bonnici-galea-2015-swot-analysis`. All nine that remain kept their
arXiv-id filename. So the sessions that renamed an upload also tidied it away,
and the sessions that did not, did not.

## Nothing in the pipeline does it

`ingest-document.ts` reads the PDF, writes to `ingest-staging/`, and promotes
into `library/<slug>/`. It never renames, moves, copies or removes the upload,
and no skill says what should happen to it afterwards. The five were removed
by hand.

## But "not ingested yet" IS modelled, and staying is not a leak

`gen-uploads-viz.ts` gives an upload two states, `waiting` and `ingested`
(`itemState`), so a file that remains after promotion is in a state the model
has a name for. The owner already ruled on why the queue is its own viewer
(bean `v18c`):

> uploads/ are not ingested, they are ingested into libray/. separate
> visualizations … actually funcionally different/behavior diffent so need
> distinct harness

and the reason the viewer's headline is the UNINGESTED count:

> an un-ingested source is worse than an absent one, because it produces false
> confidence rather than a gap

What is NOT stated anywhere is the **retention** rule: whether `ingested` is a
terminal state an upload may sit in forever, or a transient one before the file
goes. That is the whole gap, and the 9-against-5 split is what an unstated rule
looks like.

## The part that is not a tidy-up

**A library entry does not hold its source bytes, and currently may not.**
`ENTRY_DIRECTORIES` is `sections`, `blocks`, `images`, `ocr`; `ENTRY_SIDECARS`
is `images.json`, `vector-labels.json`, `manifest.jsonld`, `summaries.json`;
plus one kind marker. Verified by experiment 2026-09-29 — dropping the PDF into
a promoted entry makes `check:l1-complete` report:

> ✗ contents  1 unexpected child(ren): source.pdf

So `uploads/` is the only place in the working tree where the PDF exists. The
entry records `source_sha256` and the technical metadata, not the bytes.
Deleting an ingested upload therefore does not *move* the source into the
library — it removes it from the tree, leaving only git history.

That makes the owner's question two decisions, not one, and the second is the
load-bearing one.

## Done when

- [ ] **Decision 1 — does a library entry carry its source?** If yes,
      `ENTRY_SIDECARS` gains it, `check:l1-complete` stops refusing it, and
      the repository's size grows by the corpus (the PDFs here already include
      a 4.4 MB and a 2.8 MB one, and `bun run health` watches clone cost).
      If no, an ingested upload is the archival copy and must NOT be deleted,
      which answers the retention question by itself.
- [ ] **Decision 2 — the retention rule**, whichever way 1 goes, written down
      in `library-ingestion` rather than left to each session's habit
- [ ] whatever is decided, `deletion-requires-confirmation` still holds: the
      pipeline reports what would go, with sizes, and a person decides. An
      ingest step that silently removed somebody's upload is the `plj1` shape.
- [ ] the nine remaining uploads reconciled with the rule, one way or the other
