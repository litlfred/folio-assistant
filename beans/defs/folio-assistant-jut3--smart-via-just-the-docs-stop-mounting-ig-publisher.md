---
# folio-assistant-jut3
title: 'SMART-* VIA JUST-THE-DOCS: stop mounting IG Publisher HTML; render input/pages from post-processed JSON-LD + metadata through the Jekyll pipeline'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T19:10:00Z
updated_at: 2026-09-21T19:04:59Z
parent: folio-assistant-yj32
---

## The owner's words, verbatim

Paraphrase would lose the sequencing and the scope, both of which constrain the
design:

> i want the smart-* mockups not to mount the existing rendered .html but use
> the IG Publisher+postporcessed json/jsonld +metadataindexing to reproduce the
> generated html in the justthedoc pipeline.
>
> i want the input/page(s)/ content to be rendered viajustthedocs pipeline. use
> metadataetc fro IG publisher to populate the variables jekyl processes.
>
> i want to slowly get rid of IG publisher in the publication/iteration pahse.
> you or sibling should be working on AST dump as cache of published IG. we can
> use this for iterative delta's (if we dont care about indexing/versioning so
> much in STAGING, we need full IG AST rereun)
>
> keep working asset types and pages until you get rendering parity-ish with IG
> publisher. get to MVP

And on ordering: *"do that after left navbar"* — so `hw9g` lands first.

## What this reverses

`smart-trust/docs/` is 20 finished HTML files produced by the IG Publisher and
**mounted verbatim** by `mount-instance-docs.ts`. This makes them Jekyll pages
instead: `input/pages/` as content, IG Publisher's post-processed JSON/JSON-LD
and metadata index as the variables Jekyll interpolates.

## Why it matters beyond looks

Mounted HTML is opaque to everything the harness does. It carries no front
matter, so the navbar, the language bar, the QA badges and the translation
surface all stop at its edge — `hw9g` exists precisely because a mounted page
gets no sidebar. Rendering through the pipeline makes a SMART Guideline page an
ordinary folio page.

**It also makes `hw9g` unnecessary for `smart-trust` specifically** — a Jekyll
page gets the real sidebar. `hw9g` is still needed for `who-iris`, which is a
deliberate replica of somebody else's site and must not wear just-the-docs'
layout. Worth stating so the rail is not later removed as redundant on the
strength of this bean alone.

## Three things to measure before designing anything

1. **What does the IG Publisher actually emit as data?** The JSON/JSON-LD and
   the metadata index — their shapes, and which Jekyll variables they can
   populate. Read the artefacts, do not infer from the HTML.
2. **What is in `input/pages/`** for `smart-trust`, and in what markup.
3. **What does parity mean here** — which asset types and page kinds the
   Publisher renders, so "parity-ish" has a checklist rather than a feeling.

## Sequenced after, not part of

The **AST dump as a cache of the published IG**, for iterative deltas. The
owner says a sibling may already be on it. Check before starting: three
duplications cost real work on 2026-09-21 (`y90d`, `lps0`, `u1iu`), and a
fourth was avoided only by asking first.

## Done when

- [ ] The three measurements above, recorded with provenance
- [ ] `input/pages/` renders through just-the-docs with Publisher metadata
      populating the Jekyll variables
- [ ] A stated parity checklist, and MVP declared against it rather than
      against an impression
- [ ] `smart-trust` no longer mounted as finished HTML
