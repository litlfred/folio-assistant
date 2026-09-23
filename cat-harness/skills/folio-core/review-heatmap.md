---
name: review-heatmap
description: >-
  The review page's heat map: a section-by-metric table that tells a reviewer
  of a large document where to look first. Says what each column MEANS and
  what it must NOT be read as, where each number comes from, which columns
  are not measured yet and why, and how the colour was chosen. Use when a
  reviewer or author asks "where do I start", reads a number off the heat map,
  or asks why coverage or QA say "not yet"; and before adding a column.
capability: review
package: folio-core
user_invocable: true
allowed-tools: Read Grep Glob
---

# Review heat map — where to look first

> Skill id: `review-heatmap` · Capability: `review` · Package: `folio-core` · Bean: `qbfi` · Epic: `q4jm`

The review page (`review/` in a folio's staging preview) opens with a table.
It has **one row per section**, in reading order, and **one column per
measure**. The darker a cell, the more there is. Every cell also shows its
number, so colour never carries the meaning alone. A section's name moves
focus to that section in the list of changes below it.

It is **not** the block-dependency heat map in `content-graph`. That one
draws which blocks depend on which, for a paper's structure; this one is
about a REVIEW.

## What each column means, and must not be read as

| column | counts | from | must NOT be read as |
|---|---|---|---|
| **Changed blocks** | blocks in the section that the ChangeSet lists: added, removed or changed | `changeset.json` | how much text changed. A one-word edit and a rewrite each count 1. |
| **Open comments** | review comments still `open` or `addressed`, with defects counted in brackets | `review-comments.json` | how bad the section is. One comment may be about the whole section, and a question is not a defect. |
| **Stale comments** | open comments whose block changed AFTER the comment was made (its recorded hash differs from the block's current one) | `review-comments.json` + `blocks.json` | wrong or obsolete. It means **re-read the block before replying**, because the reviewer saw an earlier version. |
| **Review coverage** | **not measured yet** | — | "every comment is resolved". Coverage needs a per-block reviewer VERDICT, which nothing records until the review process does (bean `en2d`). **Resolved comments are not approval**, so none is shown rather than a number built from them. |
| **QA** | **not published yet** | — | a pass. The folio's QA results exist in its repository, but the staging build does not copy them into the preview yet. The owner asked for that next (bean `qbfi`, option 2). |

**A column with no data says so in every row** ("not measured yet", "not
published yet", or "no data" when a build lacks the file). It is never 0 and
never blank: zero reads as "measured, and nothing there", which is exactly
what is not known.

Orphaned comments (their block is gone) have no section. They are counted
in a last row, "(listed in no section)", because an open comment is still
open.

## How the colour was chosen

This follows the dataviz skill:
- **Scale.** One hue (blue), sequential, in three ordinal steps. Each
  column is scaled to its own maximum, by thirds; zero has no fill.
- **Light theme:** steps 250 / 400 / 550.
- **Dark theme:** steps 600 / 500 / 400, chosen for the dark surface rather
  than flipped from the light ones.
- **Validation.** Both ramps pass `validate_palette.js --ordinal`: they are
  monotone, their steps are visibly apart, and the lightest clears 2:1
  against the surface.
- **Ink.** Every cell's text colour clears 4.7:1 against its fill.

The table is a real `<table>` with row and column headers, so it is its own
table view for a screen reader. Every cell also has a hover title saying what
it counts.

## Where it lives

- `cat-harness/scripts/review-heat.ts`: `computeHeat` (the numbers),
  `heatBucket` (the thirds) and `renderHeat` (the table). The page embeds
  all three with `toString()`, so the tested functions are the ones that run.
- `blocks.json` carries each block's `section`, so a comment on an
  UNCHANGED block still lands in its section's row.

## Adding a column

1. **Say what it counts and what it must not be read as**, in the table
   above, before writing code.
2. Its data must be **published in the preview**, never read from an
   agent's `/tmp`.
3. Add it to `computeHeat` and `renderHeat`, with a test for its "no data"
   state as well as its numbers.
