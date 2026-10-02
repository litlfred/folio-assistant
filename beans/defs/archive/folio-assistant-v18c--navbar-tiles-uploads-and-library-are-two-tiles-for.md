---
# folio-assistant-v18c
title: 'Navbar tiles: uploads and library are two tiles for ONE page, and cat-harness''s library is empty'
status: completed
type: task
priority: normal
created_at: 2026-09-21T21:09:01Z
updated_at: 2026-09-22T06:03:28Z
parent: folio-assistant-vke6
---

Found 2026-09-21 while fixing the library viewers' parse error (the owner:
*"way too many tiles (non functional) on LHS explode menu"*). **The parse error
is fixed and shipped separately**; this is what is left after it.

## Measured in a browser, after the fix — 12 navbar tiles

| tile | renders |
|---|---|
| `schemas` (cat-harness) | 773 declarations |
| `detangle-schemas` / `large-datasets-schemas` / `cat-bootstrap-tools-schemas` / `folio-assist-core-schemas` | 9 / 11 / — / — declarations |
| `who-iris-library` | 3 entries, 84,292 words |
| `agent-skills-library` | 2 entries |
| `folio-assistant-sci-library` | 1 entry |
| `beans`, `todos` | populated |
| **`library`** (cat-harness) | **0 entries** |
| **`uploads`** | **0 entries — and the SAME page as `library`** |

## The two findings

**1. One page, two tiles.** `cat-harness.json` declares the same
`visualiser` for both:

```
uploads  -> cat-harness/docs/cat-harness/library/cat-harness/index.html
library  -> cat-harness/docs/cat-harness/library/cat-harness/index.html
```

That is deliberate — the library viewer carries an **Uploads** tab, and bean
`flh4` is on record against reporting `uploads` as having no viewer. But the
viewer has **no tab deep-linking**: no `location.hash` handling, no
`data-tab`, no `#uploads`. So both tiles land on the *Listing* tab, and the
`uploads` tile shows the library's 0 entries rather than the queue's **27
uningested**.

**2. `cat-harness`'s own library is empty.** 0 entries, and the tile is
indistinguishable from the populated ones until it is opened.

## Three ways out, none of them mine to pick

- **Deep-link the tab.** Give the viewer `#uploads` handling and point the
  `uploads` visualiser at it. Both tiles become true; costs a viewer feature.
- **Drop the `uploads` tile.** One declaration edit. But it re-opens `flh4`,
  which fixed the opposite error — `uploads` reported as unrendered while a
  working page existed.
- **Hide an empty viewer.** A tile whose projection has 0 entries becomes a
  reported gap rather than a link. That is the module's own
  *declared-vs-published* rule one step further — **published is not
  non-empty** — and it would hide `library` today and restore it when the
  corpus grows. It also changes what a missing tile MEANS, which is the part
  that needs a decision.

## RULED, 2026-09-21 — none of the three; uploads gets its own harness

The owner, asked to pick between deep-linking the tab, dropping the tile and
hiding empty viewers:

> uploads/ are not ingested, they are ingested into libray/. separate
> visualizations. (maybe same harness, but different themes/content....)

and, immediately after:

> actually funcionally different/behavior diffent so need distinct harness

So the framing in "Three ways out" was wrong, and all three options inherited
the error: each assumed ONE page that two tiles reach, and argued about how to
divide it. They are two STAGES of one pipeline, not two doors onto one thing —
which this repository already says in
`content/docs/document-ingestion/uploads-and-library-are-two-stages-of-one-pipeline.md`:

| | `uploads/` | `library/<bib-slug>/` |
|---|---|---|
| what it holds | raw files as dropped | ingested, structured, described |
| stage | incoming queue | L1 source content |
| greppable by the corpus checklist | no | yes |

`gen-library-viz.ts` reads `library-graph.ts` and `library-refs.ts` — bib-slugs,
`sections/`, `structure.json`, the OCR three-state. An uploads queue has none
of those, so "same harness, different theme" was falsified by reading the
generator: retargeting it would mean teaching a corpus browser to render a
queue.

WHAT THE UPLOADS VIEW IS FOR, from the pipeline doc's own argument: *"an
un-ingested source is worse than an absent one, because it produces false
confidence rather than a gap"* — the corpus grep searches `library/` only, so a
paper sitting in `uploads/` makes a clean grep read as "nobody has done this".
The library viewer cannot show that by construction: the thing it must surface
is exactly what is NOT in the library.

MEASURED on this checkout: `uploads/` holds 30 files (15 sources + their
`.extraction.json` sidecars), `library/` holds 0 entries. So today the uploads
tile renders the library's zero while thirty files sit beside it.

## Done when

- [x] Ruled: none of the three — uploads gets its own harness (recorded above).
- [x] `uploads` shows its own queue: `gen-uploads-viz.ts`, declared at `cat-harness/uploads/`, with its own inbox glyph.
- [N/A] If the empty rule lands: a test that an empty projection yields a gap,
      and a guard that a populated one still yields a link.
      THE EMPTY RULE DID NOT LAND. It was option 3, and the owner ruled none
      of the three. Marked `[N/A]` rather than ticked, which would claim work
      that did not happen, and rather than deleted, which would lose the
      specification if the question is ever reopened — the same treatment
      `qgpo` gave its option-B items.

*Not started. Recorded by session_01AYHimvYMmf8h8e9fFN6dW5, which measured it
and fixed only the parse error.*


## Round 1 — the uploads harness (issue #836)

`gen-uploads-viz.ts`, third sibling of `gen-schema-viz` and `gen-library-viz`,
minus one piece: it publishes a VIEWER and no projection. `state-visualizer.ts`
records the ruling (bean `flh4`/#618) that the queue block lives in
`assets/library/index.json`, *"since two projections over it would be two
answers to how many are queued"* — and this file's first draft emitted its own
anyway. One dataset, two viewers.

FOUND BY RENDERING IT, not by the gates, which were green across it: five
`.extraction.json` sidecars stood in the table as units *waiting to be
ingested*, 0 KB each. `UploadItem`'s own note names that exact error and had
fixed it for intake directories but not for loose files. The headline went
**27 → 20 waiting**, 33 → 28 units. Fixed in the READER, so the library badge
is corrected by the same change rather than the two disagreeing.

The orphan case is kept deliberately: the rule is keyed on the source being
present, so a sidecar whose source has gone still shows. A file nothing
accounts for is what a queue view is for, and dropping every sidecar would be
this defect with the sign flipped.

Still open on this bean: cat-harness's own `library/` renders 0 entries. And
issue #836's other two deliverables — the librarian role and the filing skills
(Dublin Core, web-page archiving at both fidelities, arXiv materialization) —
are not started.


## Round 2 — the librarian (issue #836, deliverables 2 and 3)

A ROLE gap, not only a viewer gap. Of 43 declared roles the only
ingestion-adjacent one was `ingestion-agent`, whose persona is *"turns an
uploaded source into corpus"* — DERIVATION. Nothing in the model knew how to
acquire or file. Dublin Core was analysed in a doc and used by
`tabular-metadata`, but no role carried it; arXiv appeared only as citation
metadata in `bib-qa`/`paper-importer`, with no acquisition path; web-page
archiving was absent entirely.

- `role:librarian` + `actor:librarian`, filed beside `ingestion-agent`. The
  actor is `person` deliberately: the decisions it owns are the ones an
  unattended engine must not make — may this be redistributed, does a
  logged-in view count as the public document, is an approximate vocabulary
  term worse than a local one.
- `filing-dublin-core` — what `dcterms` carries and where it stops, under the
  house rule *generalising is sound; inventing is not*. Carries the sidecar
  rule this round's reader fix came from.
- `archiving-web-pages` — PDF and tarball are evidence of DIFFERENT things
  (appearance vs content) and neither substitutes. The queue proves it: two
  vendor doc pages captured PDF-only, assets already gone.
- `archiving-arxiv` — the version suffix is part of the identity, not
  decoration. `2602.12670v4` is what was read; `2602.12670` is a question.

WHAT THESE SKILLS DELIBERATELY DO NOT DO: state API endpoints, response field
names or the arXiv id grammar. No network here, and the repo's own rule in
`how-much-of-this-does-dublin-core-carry.md` is that such things are *settled
against the published specifications rather than from memory*. Each page names
what must be looked up instead of asserting it — a field name that is almost
right parses to `undefined` and loses authors silently rather than erroring.

`kg:audit` bound the role: `role-has-actor` fired on exactly one role, mine,
which is how the missing actor was found.


## Summary of Changes

Closed by #838 (`e4f58487`), against issue #836.

**Finding 1 — one page, two tiles: RESOLVED.** `uploads` has its own harness
(`gen-uploads-viz.ts`), its own route, its own inbox glyph, and a view that
answers queue questions rather than corpus ones. Verified on the staging
deploy through gh-pages: two distinct tiles, two distinct pages, two distinct
glyphs, 0 of 12 off-site, live badges reading 20 waiting.

Round 1 also fixed a defect the gates were green across, found by rendering
the page: five `.extraction.json` sidecars were standing in the queue as units
*waiting to be ingested*. 27 → 20 waiting. Fixed in the reader, so the library
badge is corrected by the same change.

Round 2 added the librarian the owner asked for: `role:librarian`,
`actor:librarian`, and `filing-dublin-core` / `archiving-web-pages` /
`archiving-arxiv`.

**Finding 2 — cat-harness's library renders 0 entries: NOT A DEFECT, and this
bean is the wrong place to pursue it.** The `library` entry in
`cat-harness.json` says so in its own description: *"THIS INSTANCE HOLDS
NONE"* — bean `frs5` moved all four entries out (three IRIS items to
who-iris, milnorlink to folio-assistant-sci) *because the platform holds no
content*, and the declaration is kept only so a DEPENDENT folio inherits the
convention (`wwi6`). So the count is correct and the directory is deliberately
empty.

What this bean actually observed is narrower and survives: an empty viewer's
tile is indistinguishable from a populated one until it is opened. That was
option 3 — *hide an empty viewer* — which the owner did not take, and which
changes what a MISSING tile means across the whole system. Left unfiled rather
than filed as a defect, because it is a design question nobody has ruled on,
and inventing a bean for it would be inventing the ruling.
