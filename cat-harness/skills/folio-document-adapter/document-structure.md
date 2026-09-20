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

The directory name is the chapter's slug; it appears in build output and in
every path a reviewer sees, so name it for what the chapter is about rather
than for its position. A `ch3-` prefix is a rename waiting to happen the first
time something moves.

## Reordering

Move the entry in `chapters[]` — nothing else. Do **not** rename directories
to encode order: labels, `uses[]` targets, feedback records and QA sidecars
all key on names, and a rename breaks every one of them for a change that the
manifest already expresses.

After any reorder, re-read `uses[]` across the moved chapter: an editorial
edge that pointed backwards may now point forwards, which is a real finding
about reading order rather than a mechanical detail.
