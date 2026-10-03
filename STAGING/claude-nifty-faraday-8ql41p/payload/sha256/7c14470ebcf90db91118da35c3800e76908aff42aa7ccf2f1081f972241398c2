---
# folio-assistant-ay3x
title: 'VECTOR FIGURE ARM: render vector drawings, and the role threshold nobody may pick from this corpus'
status: in-progress
type: task
parent: folio-assistant-2yyh
created_at: 2026-09-23T07:19:35Z
updated_at: 2026-10-03T09:52:39Z
---


Issue: https://github.com/litlfred/folio-assistant/issues/877 — the deferred
half of the owner's 2026-09-23 ruling on `m4xy`: **captions now, arm later.**
The caption half shipped in #1012.

## What is deferred, and what is NOT

**Deferred:** an arm that renders vector drawing groups to raster so a reader
gets the figure itself rather than a description of it.

**Not deferred, and already done:** the reader is not left with nothing. Every
declared figure that carries caption text now reports `met` on
`image-descriptions` with the caption quoted into the verdict, and a figure
with NO caption text still reports `not-derivable` and is named by label. The
gap is covered where a caption covers it and visible where it does not.

## THE THRESHOLD IS THE HARD PART, and it is not an agent's to pick

`m4xy` measured the coverage distribution over 296 figures and found it runs
continuously across three orders of magnitude. There is exactly one empty
stretch — nothing between ≈0.00012 and ≈0.00033, separating 143 near-zero
fragments from everything else — and above it nothing separates a figure from
furniture.

Its own conclusion, which stands: **no number is proposed**, because *"a
threshold chosen after seeing this corpus is a number chosen to fit the
answer."* That is why the caption handle won — it needs no number at all. A
caption either has text after `Fig. N.` or it does not.

So this bean does not begin with an implementation. It begins with the owner
deciding on what basis a role threshold may be set, if one may be set at all.

## A measurement this session added, which changes the target

`declaredFigureCaptions()` (`check-l1-complete.ts`) now separates a caption
from a cross-reference by the period after the number. Over the real corpus,
2026-09-23:

| document | line-start labels | captions | bare |
|---|---|---|---|
| `9789240120747-eng` | 6 | **6** | 0 |
| `9789240010567-eng` | 42 | 29 | 13 |
| `9789240093362-eng` | 18 | **3** | **15** |

**The declared-figure counts `m4xy` surveyed were overstated**, and in one case
badly: `9789240093362-eng` declares 18 by the lower bound and only three are
captions. So the arm has fewer real figures to find than the survey implied,
and the ones it must find are the BARE ones — the figures with neither a raster
image nor a caption, which is the only set the caption handle cannot reach.

That is a much narrower target than "all vector figures", and it is the set
this bean should be measured against.

## Done when

- [x] the owner says on what basis a role threshold may be set, or that one may
  not be — a number chosen from this corpus is refused by `m4xy` and that
  refusal stands. **Ruled 2026-10-03**, verbatim: *"an optional one can be
  set, default none"* (it supersedes an earlier *"no cutoff"*). Relayed by
  the parent session https://claude.ai/code/session_015Q15h1fg2Hh9MJXfAqr4h7.
  Implemented as `pdf-images.py --role-threshold`, which has no default and
  writes role `furniture` on a `{method: threshold, value, suppliedBy: caller}`
  basis. The vector arm takes no cutoff
- [x] the arm is measured against the BARE figures specifically, not against
  every declared label — 47 of 49 shown, the other 2 correctly not (below)
- [x] a rendered figure carries an inspection basis naming who or what looked,
  the same as a raster one — a silently placed image is the defect `d5f1`
  closed
- [x] `image-descriptions` still reports `not-derivable` where neither a
  caption nor the arm reaches, rather than passing on a count

_2026-10-03T09:52:37Z_ — Claimed by claude/vector-figure-arm-ay3x — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-10-03 — built, on the owner's ruling "Yes, build it."

Session https://claude.ai/code/session_012vJhm2nLrDMYghqFftZCQZ, issue #1980.

**What shipped.** The arm is `scripts/pdf-vector-figures.py`, which writes
`<entry>/vector-figures.json` (`folio-vector-figures/v1`,
`schemas/vector-figure.ts`) plus `<entry>/figures/vfig-pNNN.png`. It runs as
an ingest arm between the labels arm and `apply-image-verdicts`. It does three
things:

- **Assembly.** Drawings are grouped into connected components of touching
  rectangles. Each label goes to the smallest component, and the smallest
  closed shape, containing its centre. Boxes are nested by containment, and
  connectors are open strokes whose two ends land in labelled boxes. An end
  that lands in no box is `null`, never snapped to the nearest. Every rule is
  structural; the one length used is a stroke's own width.
- **Render.** The crop is the union of label-bearing components, minus any
  that touch the page's trim edge, unless those are all there is.
- **No role.** Every entry is `role: undetermined` with a basis
  `{method: "assembly", by: {kind: "script"}}`, so the machine names itself
  and the schema refuses any role at that basis. A role arrives only by
  inspection, through `apply-image-verdicts.ts`, keyed `vfig-pNNN` in the same
  `image-verdicts.json`. A verdict's `shows` names the declared figures a
  render holds. **No threshold was picked or needed.**

**The gate.** A bare figure counts as covered only when an INSPECTED,
described render `shows` it. A render nobody has inspected is a candidate,
not coverage: a page's caption candidates include cross-references. The arm
never produces `unmet`, because CI fails on any `unmet` (the `pn6j` rule).

### Measured against the BARE figures (2026-10-03)

Bare means a declared figure with no caption text by `declaredFigureCaptions`.
In the entries that place raster images, which of those images the bare
figures are is not established.

| entry | bare | shown by an inspected render | not reached |
|---|---:|---:|---|
| `9789240010567-eng` DIIG | 13 | 13 | — |
| `9789240093362-eng` PHC | 15 | 14 | `2.7`: a CITATION of another WHO guideline's figure, inside Fig. 13's table, not a figure of this document |
| `9789240101197-eng` | 5 | 5 | — |
| `9789240116191-eng` | 15 | 15 | — |
| `9789241511766-eng` M&E | 1 | 0 | `6.1`: RASTER, already placed as `img-p128-1` and described; the vector render on that page is unrelated callout boxes |
| `mehl-2021-…`, `who-dpi-h-…` | 13 | not measured | no source PDF in this checkout |

So **47 of the 49 measurable bare figures are shown, and the 2 not shown are
correctly not.** Before inspection, all 49 were *named* on some render. That
number is not coverage and was never reported as such: 4 of the 52 renders
inspected turned out to hold no figure. They are p14 PHC (chapter tabs),
p41 `116191` (a table header), p32 `101197` (a text panel) and p131 DIIG (a
chapter opener), each filed `decorative` with the reason in `saw`.

**Why so many "bare" figures were reachable at all.** Most are not uncaptioned.
`declaredFigureCaptions` requires `Fig. N.` + space. `116191` writes
`Fig. 1:` (a colon), PHC writes `Fig. 13\t` (a tab), and the DIIG's p17–p133
captions are on the page but lost in section extraction. The caption
handle's lower bound is very low on this corpus. That is a finding for
`m4xy`'s caption ruling, and **it is not changed here**.

### Findings for the owner, not acted on

1. **The role vocabulary has no "text panel".** Two renders were boxed text,
   not figures, and `decorative` is the nearest role. It misdescribes them
   slightly, and the reason is recorded in `saw` each time.
2. **Two source discrepancies, recorded as printed.** DIIG Fig. 3.1.1.1's
   caption says three processes but its table holds four (A–D). DIIG
   Fig. 9.1 numbers an item under chapter 08 as `7.2`.
3. **The crop's stated limit is real.** DIIG p25 titles its architectures in
   white space above the boxes, and these fall outside the crop
   (`assembly.outside` counts them). Some crops take in body prose beside the
   figure. Neither is corrected by a guess.
4. **75 of the 127 renders are uninspected** (measured 2026-10-03) — figures that
   already have captions. They are reported by `apply-image-verdicts` and by
   the gate's detail, and they block nothing.

