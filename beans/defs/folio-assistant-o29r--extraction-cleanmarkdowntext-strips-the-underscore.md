---
# folio-assistant-o29r
title: 'EXTRACTION: cleanMarkdownText strips the underscores of LaTeX subscripts and snake_case identifiers — a translator receives a corrupted formula'
status: todo
type: bug
priority: high
created_at: 2026-09-26T14:43:40Z
updated_at: 2026-09-26T14:44:08Z
parent: folio-assistant-bzyu
---

## The defect, minimally

`MD_ITALIC_UNDER_RE` in `cat-harness/content/pipeline/pot-extract.ts` is

    /(?<!_)_([^_]+)_(?!_)/g

with no word-boundary condition, so any two underscores in one extracted string
are read as an `_emphasis_` span and both are deleted. Measured:

| input | `cleanMarkdownText` gives | should be |
|---|---|---|
| `$a_1$ and $b_2$` | `$a1$ and $b2$` | unchanged |
| `x_1 y_2` | `x1 y2` | unchanged |
| `snake_case_name stays` | `snakecasename stays` | unchanged |
| `$Q(q_0)$ ... $V(\mathcal{B}_3)$` | `$Q(q0)$ ... $V(\mathcal{B}3)$` | unchanged |

A single subscript on its own is safe (`$a_1$` alone survives) because the
regex needs a second underscore to close on. **Two is the threshold**, and two
is the common case in mathematical prose.

## Why this is not cosmetic

The mangled string is the `msgid`. A translator is handed `$Q(q0)$` and has no
way to know the source said `$Q(q_0)$`; `injectMarkdown` then substitutes on
that msgid, so the corruption is what round-trips. For a `paper` folio the
corrupted thing is a mathematical expression — a different formula, not a
typo. `snake_case` shows the same defect reaches any folio with identifiers in
prose, so this is not a maths-only concern.

## It is CommonMark that settles it, not taste

CommonMark's intraword rule: `_` cannot OPEN emphasis when preceded by an
alphanumeric, and cannot CLOSE when followed by one. `a_1 b_2` is therefore
literal text in every conforming renderer — so the site renders the subscript
correctly while the extractor strips it. The gate and the page disagree, and
the page is right.

## Proposed patch — measured, not sketched

    const MD_ITALIC_UNDER_RE = /(?<![_\w])_([^_]+)_(?!\w)/g;

Against eight cases (the four above plus `_emphasis_`, `say _this_ and _that_`,
`a _multi word_ span`, `__bold__`): the current regex is wrong on 4 of 8, the
candidate on 0 of 8. It changes nothing about the four that already passed.

## How it was found — lvk9's cross-folio Done-when item

`lvk9` asked for the extractor to be checked against a folio other than this
one. `litlfred/qou` carries no `.po` at all, so the check became a comparison of
the extractor at `958e36d7840^` (6b8u + ig4a + wlyg, no hard-wrap merging)
against the extractor now, over 150 of qou's markdown files:

| class | count |
|---|---|
| msgids old to new | 17832 to 16022 |
| unchanged | 14416 |
| merges (what `lvk9` intends) | 1128, widest 12 old entries |
| differ only by collapsed internal whitespace | 191 |
| **differ only by a stripped subscript underscore** | **122** |
| neither (inline-code gaps, `3mo4` territory) | 165 |

`lvk9` does not CAUSE this — the minimal case needs no merging — but it widens
the blast radius, because joining hard-wrapped lines puts more subscripts into
one string, and the pre-`lvk9` extractor's per-line cleaning happened to
protect a subscript that was alone on its line.

## Three harness corrections on the way to that table

Worth recording, because each manufactured findings that looked real:

1. A wrap-invariance harness re-wrapped prose and reported 95 violations. Its
   re-wrap put `+ JSON-Schema` at the start of a line, which IS a markdown
   bullet, so the extractor was right and the harness was wrong.
2. An over-merge regex reported 86 violations, firing on `proved in  + Lean` —
   a double space left where an inline code span was stripped, not a merge.
3. Comparing the two outputs as SETS reported 3459 dropped msgids. A msgid
   corpus is a MULTISET: `indexOf` consumed only the first `"Package"`, so the
   second copy of a repeated table header read as dropped. Any corpus with
   tables breaks a set-based comparison this way.

## Done when

- [ ] `MD_ITALIC_UNDER_RE` carries the intraword guard
- [ ] a test covers `$a_1$ and $b_2$`, `x_1 y_2` and `snake_case_name`
- [ ] the qou comparison re-run and the 122 class measured at 0
- [ ] the catalogues already derived are re-derived, or their stale msgids
      obsoleted, ONCE together with `6b8u`, `ig4a`, `lvk9` and `3mo4`
