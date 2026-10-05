# Latent semantic indexes — as-is intent

## Covers

- Declared visualiser ref: `cat-harness/docs/lsi/index.md` (tile `qa`, title "Latent semantic indexes", href `/lsi/`, surfaces `navbar`, `board` and `glass`, in `cat-harness/docs/_data/harness.json`; also listed under "Every declared viewer" on `/cat-harness/`).
- Generator: `cat-harness/scripts/gen-lsi-viz.ts`, reading the committed sidecars under `cat-harness/test/results/lsi/` and the need-an-index verdicts from `scripts/lsi.ts` (`graphVerdict`).
- Rendered by Jekyll with just-the-docs. I could not build the site here, so this drawing is read off the generated Markdown and the generator, not measured on a rendered page.

## Who it is for, and what they need to do

- **Reader:** an agent or person who has run a lexical search and wants the vocabulary-gap view of a graph; a reviewer checking an ingest for outlier pages; whoever maintains the indexes.
- **Tasks:** see which prose graphs need an index and which are stale; read an index's dimensions as contrasts; find outlier pages (narrow dimensions) and near-duplicate units worth reading.

## What it must show (read off the generator)

- the framing: a latent index is a retrieval aid and every output is a proposal
- three stat boxes: committed indexes, units indexed, graphs needing an index
- the need-an-index table: one row per declared prose graph, verdict and a count-free detail
- per index: size, retained share, weighting, sidecar path; a margin warning when dimension 1 has no negative pole; the first 8 dimensions as two poles, never named; narrow dimensions and near-duplicates

## Observed

Regions in reading order: strip; title; two framing paragraphs; stat boxes; the verdict table (17 rows); one section per index (3), each with a dimension table and a findings list; the generator line.

Mobile (≤ 390): stat boxes wrap; both tables scroll sideways inside their wrapper; long unit paths break inside code.

## Findings

1. **Unit paths are long and repeat their prefix.** `who-iris/library/wpr-rdo-2020-003-eng/sections/page-014.md` dominates each findings line; the document and page are the part a reader needs.
2. **Findings are not links.** A narrow dimension or near-duplicate names a section the reader cannot open from here.
3. **The dimension table is wide on mobile** — four columns, two of them term lists — and nothing says it scrolls.
4. **The verdict colours were chosen for the dark scheme** (8.2:1 and 7.0:1 on `#27262b`); the word carries the state either way.
