---
# folio-assistant-7nvr
title: 'KG BROWSER: a library entry''s blocks are counted, never read — nothing renders the graph the corpus carries'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T19:05:22Z
updated_at: 2026-09-23T19:15:36Z
---

parent: folio-assistant-0lmb


Issue #1149, opened as requirements-only on the owner's ruling and then built
on their "do 1149".

## The gap, measured

`scripts/library-graph.ts` COUNTS an entry's blocks:

    blocks: filesIn(join(dir, "blocks")).filter((f) => f.endsWith(".jsonld")).length,

So the viewer answers *how many* and never *what*. Meanwhile every block
carries `@type` (two of them), `kind`, `title`, `pageStart`/`pageEnd`, a
pointer to its content, a `narrative` state and `provenance` — a real graph
that nothing rendered.

## Three measurements that shaped it

**1715 blocks, ~1 MB of JSON-LD, against a 44 KB index.** So one projection is
out. Per-entry files fetched on demand: 22 files, 648 KB total, largest 105 KB.

**ZERO cross-entry edges.** Every `derivedFrom` and `sourceDocument` in all
1715 blocks points at its own entry's manifest. So "follow `derivedFrom`
across entries" — one of the three open questions on #1149 — is currently
VACUOUS. Per-asset is not a reduced scope; it is the whole graph. Settled by
measurement rather than by preference, and I would have guessed the other way.

**The library JSON-LD is not published to the site.** Checked against the
staging build: no `library/<id>/manifest.jsonld` under the built tree. So the
viewer cannot fetch the source and a projection is genuinely needed rather
than a redundant copy. That was the falsification check.

## The order is NOT the manifest's, and the first draft got this wrong

`manifest.contains` looked like the obvious order. Measured on
`arxiv-2602.12670v4`: it holds **82 entries, all sections, naming no block at
all**, while the entry has 85 block files. Every block fell through to the
alphabetical tail, which sorts `figure-img-p025-1` ahead of `prose-sec-000`
and opened the document on a colourbar from page 25.

**A manifest links DOWN to its sections; blocks link UP to the manifest.**
There is no downward edge to a block, so there is no manifest order to take.
Order is now `pageStart` then id — derivable from what a block carries, and it
IS document order. An unplaced block sorts LAST, because burying it at the top
is how it goes unnoticed.

That asymmetry is reported, not fixed: inventing the missing edge is a schema
change and nobody asked for one.

## Todo

- [x] `readEntryBlocks` in `library-graph.ts` — separate from
  `readLibraryGraph`, which runs over every library on every call and must not
  read 1715 files to answer a count it already has
- [x] per-entry projections at `assets/library/entries/<id>.json`
- [x] a block panel in the viewer, driven off the ANCHOR so a shared URL lands
  on the same view
- [x] three outcomes, never two: blocks listed / entry genuinely has none /
  the fetch failed. An empty entry and an unreadable one must never look alike
- [x] both `@type`s shown, never one
- [x] `bun run gates` green

## The trap, hit again

The first draft escaped `class=\"empty\"` inside the page template literal.
That collapses one level and emits a bare quote, so the ENTIRE inline script
failed to parse while the page still looked fine —
`generated-viewer-scripts` caught it, which is exactly the gate's purpose.
Rewritten with single-quoted JS strings so there is nothing to collapse.

Documented in the dispatcher and in-repo, watched for, and hit anyway. The
lesson is not "be careful": it is **do not escape quotes inside a template
literal when the other quote character is free**.

## Not this bean

Any write path (`yj32` is open). Cross-entry navigation — nothing to navigate.
Superseding `docs/kgraph.md` or `docs/subgraph-viewers.md`.
