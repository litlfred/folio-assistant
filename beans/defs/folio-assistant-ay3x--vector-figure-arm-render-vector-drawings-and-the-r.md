---
# folio-assistant-ay3x
title: 'VECTOR FIGURE ARM: render vector drawings, and the role threshold nobody may pick from this corpus'
status: todo
type: task
parent: folio-assistant-2yyh
created_at: 2026-09-23T07:19:35Z
updated_at: 2026-09-23T07:19:35Z
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

- [ ] the owner says on what basis a role threshold may be set, or that one may
  not be — a number chosen from this corpus is refused by `m4xy` and that
  refusal stands
- [ ] the arm is measured against the BARE figures specifically, not against
  every declared label
- [ ] a rendered figure carries an inspection basis naming who or what looked,
  the same as a raster one — a silently placed image is the defect `d5f1`
  closed
- [ ] `image-descriptions` still reports `not-derivable` where neither a
  caption nor the arm reaches, rather than passing on a count
