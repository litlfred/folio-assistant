---
input: schemas/skills/document-structure/input.schema.json
output: schemas/skills/document-structure/output.schema.json
---

# document-structure

Decide and maintain the chapter/section skeleton of a document folio.

## Structure is authored, not inferred

Nothing derives the outline from the prose. Three manifests hold it, and each
is an ordered list:

| File | Holds | Order means |
|---|---|---|
| `content/<slug>/<slug>.ts` | `chapters: ChapterRef[]` | reading order of chapters |
| `<chapter>/<chapter>.ts` | `sections: Section[]` | reading order within the chapter |
| a section's `blocks: string[]` | block root names | reading order within the section |

A block reaches the output **iff** some section names it. This is the single
most common way work disappears: the `.ts` and `.md` are written, committed,
and reviewed, and the block renders nowhere because nothing lists it. Adding
the name to `blocks[]` is part of adding a block, not a follow-up.

## Sections may nest exactly one level

`subsections[]` on a section carries another section, whose `blocks[]` render
under a deeper heading. One level only — the renderers flatten at that depth,
so a third level silently loses its blocks rather than nesting further. If you
need a third level, you need another chapter.

## Chapter granularity

A chapter is the unit a reviewer is asked to read in one sitting, and the unit
the work plan tracks. Prefer more, smaller chapters over few large ones: a
chapter is also the unit that gets *rewritten*, and a 40-block chapter is one
nobody will re-order.

## Adding a chapter

1. `mkdir content/<slug>/<chapter-dir>`
2. Write `<chapter-dir>/<chapter-dir>.ts` — title, optional `label`, and
   `sections[]` (which may start empty).
3. Add `{ dir: "<chapter-dir>" }` to the document manifest's `chapters[]`, in
   the position it should be read.
4. `content_validate`.
5. `bun run review:anchors`, so the review sheet's Selected Sections list
   and every comment's placement see the new chapter.

**Every document folio declares `review:anchors` and `check:review-anchors`
from its first commit** (`review-anchors-from-folio.ts --document <doc>`;
the `--library`/`--source` flags only when it was seeded from a library
file). The section list is what a review sheet's dropdown reads; a folio
without it leaves a linked sheet empty (owner, 2026-10-31, DTH-PC). See
`review-sheet-script`, "Linking a sheet to a repository".

The directory name is the chapter's slug; it appears in build output and in
every path a reviewer sees, so name it for what the chapter is about rather
than for its position. A `ch3-` prefix is a rename waiting to happen the first
time something moves.

## Reordering

Move the entry in `chapters[]` — nothing else. Do **not** rename directories
to encode order: labels, `uses[]` targets, feedback records and QA sidecars
all key on names, and a rename breaks every one of them for a change that the
manifest already expresses. Then `bun run review:anchors`, as after adding one.

After any reorder, re-read `uses[]` across the moved chapter: an editorial
edge that pointed backwards may now point forwards, which is a real finding
about reading order rather than a mechanical detail.
