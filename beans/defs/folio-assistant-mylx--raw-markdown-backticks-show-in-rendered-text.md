---
# folio-assistant-mylx
title: Raw Markdown backticks show in rendered text
status: in-progress
type: bug
priority: normal
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-29T22:51:20Z
parent: folio-assistant-4ccr
---

Descriptions carried from Markdown front matter or prose are rendered as plain text, so the backticks show. Render inline code (or strip the markers) in the shared text path.

Observed on: `fsh-guts`, `glossary`, `methodologies`, `navbar`, `skills-index`, `voices` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.

_2026-09-29T22:51:20Z_ — Claimed by claude/charming-curie-n04agq — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
## Done when

- [x] Backtick spans in carried prose render as code, or their markers are removed where markup cannot go
- [x] Measured before and after over a built site

## Summary of Changes — 2026-09-24

**Measured** over a local build, excluding `smart-trust/`, `api/` and
`reference/`. The count is backtick spans in VISIBLE text, outside
`code`/`pre`/`script`/`style`:

| | pages | occurrences |
|---|---|---|
| before | 265 | **10,071** |
| after | 12 | **23** |

**The sources, by where they sat:**
| where | before | fix |
|---|---|---|
| the todo listing on every themed page (`fa-todo-listing-body`) | 7,781 | `todo-listing.ts`, summary and body |
| sidebar titles (`a.nav-list-link`) | 1,004 | `gen-skill-docs.ts` strips the markers from `title:`, which the theme prints as plain text |
| the glossary (`dl.fa-gloss`) | 1,118 | `glossary-page.ts`, labels and definitions |
| docs-auto indexes | 132 | `gen-docs-auto.ts`, summaries |
| the home page's harness sections | 13 | `harness_details.html`: `markdownify` |
| the who-iris caveat | 4 | `gen-iris-pages.ts` |

**One helper:** `schemas/inline-code.ts` (`withInlineCode`, `stripInlineCode`).
It takes the CALLER's escaper, because the glossary also escapes `{` for Liquid,
and a second escaper would be a second answer to what is safe. Six unit tests.

**Left on purpose (23):** the wireframes' `as-is` drawings (10), which depict
the old state, plus slugs on three process pages.

**Found on the way:** once rendered as `<code>`, a glossary definition became
a path claim, and `check:declaration-filename` caught it. The source doc comment in
`sticky-contribution.ts` still named the retired `harness.json` files. It is fixed
to `<instance>/<instance>.json`.

