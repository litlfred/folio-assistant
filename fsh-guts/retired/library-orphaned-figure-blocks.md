---
$schema: folio-fsh-guts/v1
title: "182 library figure blocks that no section references any more"
kind: orphaned-generator-output
movedOn: 2026-10-01
movedFrom: "six library entries' blocks/ directories (agent-skills, cat-harness, smart-base)"
bean: folio-assistant-bh4q
issue: 1815
summary: >-
  `figure-img-p*.jsonld` block nodes that `gen-library-jsonld` reported as
  orphaned: written by an earlier image ingest, and referenced by no section,
  sheet or manifest since their images left `images.json` (the one checked,
  arxiv-2602.12670v4 p026, is the same "Pass Rate" colour scale already kept
  as p025). Found while regenerating every content document for bean bh4q,
  which they were the only documents to miss. Owner, 2026-10-01: "fsh-guts".
  Packed from commit 597810687 by `git archive` as one archive beside this
  file, rather than left loose, so no scanner reads them as live nodes —
  several carry agent-drafted figure narratives worth keeping.
---

# Orphaned library figure blocks

`library-orphaned-figure-blocks.tar.gz` beside this file holds 182 block
nodes, each at the path it had in the checkout. List them with
`tar -tzf library-orphaned-figure-blocks.tar.gz`, or read them at commit
`597810687`.

| library entry | files |
|---|---:|
| `smart-base/library/9789241509510-eng` | 59 |
| `cat-harness/library/arxiv-2312.07755v1` | 56 |
| `smart-base/library/9789241511766-eng` | 55 |
| `smart-base/library/9789240010567-eng` | 6 |
| `smart-base/library/9789240081949-eng` | 5 |
| `agent-skills/library/arxiv-2602.12670v4` | 1 |

**How they were found.** The list is exactly what `orphanedBlocks` in
`cat-harness/content/pipeline/gen-library-jsonld.ts` reports: a block file in
`blocks/` whose id no `manifest.jsonld`, section or sheet `contains`. None had
an `.md` sibling. The generator's own `--prune` would have deleted them; this
relocates them instead, which is reversible.

**They still carry the bare context URL.** They predate bean bh4q, so their
`@context` is the published URL alone, without `@base` beside it. Do not
unpack them back into place: re-ingest the entry instead, and the generator
writes current nodes for whatever images it now keeps.
