---
# folio-assistant-o29r
title: 'EXTRACTION: cleanMarkdownText strips the underscores of LaTeX subscripts and snake_case identifiers — a translator receives a corrupted formula'
status: completed
type: bug
priority: high
created_at: 2026-09-26T14:43:40Z
updated_at: 2026-09-27T04:56:09Z
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

- [x] `MD_ITALIC_UNDER_RE` carries the intraword guard
- [x] a test covers `$a_1$ and $b_2$`, `x_1 y_2` and `snake_case_name` — four
      tests in `translation.test.ts`, and 3 of the 4 measured RED without the fix
- [x] the qou comparison re-run: 13251 corrupted to **0**, and 229 to **0** here
- [x] the catalogues already derived are re-derived, or their stale msgids
      obsoleted — **not applicable to this fix, measured rather than assumed.**
      Of the 14 pages that HAVE a committed catalogue, the fix changes the msgids
      of **0**. The 229 corrupted msgids are all on pages with no catalogue. The
      combined rewrite is still owed for `6b8u`, `ig4a`, `lvk9` and `3mo4`, and
      is `lvk9`'s remaining item rather than this bean's.

## Impact, measured — current extractor vs the same extractor with only the guard added

Every other stage is identical, so each difference is attributable to that one
regex and to nothing else.

| corpus | files | msgids | corrupted | share | files affected |
|---|---|---|---|---|---|
| `folio-assistant/cat-harness/docs` | 654 | 46306 | **229** | 0.49 % | 69 |
| `qou/docs` | 3038 | 211139 | **13251** | 6.28 % | 1725 |

### On this platform it breaks IDENTIFIERS

    now:  no policy grants perform-task for ProcessCodeChangeReview/TaskClaimBean
    want: no policy grants perform-task for Process_CodeChangeReview/Task_ClaimBean

Those are BPMN process and task ids. A msgid that mangles an id is a msgid a
translator cannot round-trip, and `prov-qaqc/index.md` carries a run of them.

### On a paper folio it breaks the MATHEMATICS, not just the spelling

    now:  a scalar $\hat Vi$ per Hn(q) generator $\sigmai$, weighted by $w\lambda = dq(
    want: a scalar $\hat V_i$ per H_n(q) generator $\sigma_i$, weighted by $w_\lambda = dq(

    now:  the positive subspace $G^+ = \sum{\lambdai
    want: the positive subspace $G^+ = \sum_{\lambda_i

The second pair is the one that settles the severity. `\sum_{\lambda_i}` losing
its underscores is not a subscript rendered flat — `\sum{\lambda i}` is a
DIFFERENT expression, and `\sum{...}` is not valid LaTeX at all. So the
corruption is not recoverable by a reader who knows the convention, and a
translator working from the msgid cannot reconstruct what was meant.

## An earlier measurement here was wrong, and the way it was wrong matters

The first attempt at this table ran the emphasis regex over each RAW source
line and reported 104 affected msgids in 29 pages, with
`` `content_validate`, `qa_sweep` `` as its headline sample. That sample cannot
be a finding: `MD_INLINE_CODE_RE` deletes backticked spans BEFORE the emphasis
regex runs, so the pipeline had already removed the text it claimed was
corrupted. Comparing the two full extractors is the only sound form of this
measurement, because the regex under test sits in the middle of a pipeline.

## Owner decision, 2026-09-26: its own PR, after #1411 merges

Asked with the measurement above in hand and four options. The owner chose a
**separate PR once #1411 has merged**, over folding it in, over starting it in
parallel, and over holding.

So this bean is not blocked and not in flight — it is QUEUED behind #1411, and
the reason is worth keeping: #1411 is about page discovery, and a regex on a
shared code path that rewrites 229 msgids here is a second measurement a
reviewer should be able to read on its own.

**Do not fold it into #1411** on a later turn because the catalogues are being
rewritten anyway. That was offered as option 2 and declined.

_2026-09-26T19:54:35Z_ — Claimed by claude/wonderful-gauss-7frcrw — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Fixed, and every claim here was measured in both directions

`MD_ITALIC_UNDER_RE` now carries CommonMark's intraword rule:

    /(?<![_\w])_([^_]+)_(?!\w)/g

| measurement | before | after |
|---|---|---|
| corrupted msgids, `cat-harness/docs` | 229 of 46382 | **0** |
| corrupted msgids, `qou/docs` | 13251 of 211139 | **0** |
| the four new tests | **3 of 4 RED** | 4 of 4 green |
| `translation.test.ts` | — | 51 pass, 0 fail |

The fourth test — real emphasis still stripped, including two spans in one
string — passes BOTH ways on purpose. It is the guard against buying subscript
safety by deleting the emphasis branch, which would have satisfied every other
assertion.

## THREE committed catalogues WERE stranded — the section above this was wrong

**Superseded, and the way it was wrong is the reusable part.** The paragraph that
stood here claimed "25 of 6102 before, 25 after" and "0 of 14 pages differ", and
concluded no committed catalogue was stranded. Both figures came from scripts that
resolved a catalogue's source as `join(DOCS, page + ".md")` — **top-level pages
only**. `translations/ar/agent-onboarding.po` pairs with
`docs/guides/agent-onboarding.md`, nested, so it was never in the set. A
measurement that silently covers a subset is worse than none, because the subset
looks like the whole.

`translation:block-qa:check` caught it: red on two sidecars here, exit 0 on `main`
in a worktree, so unambiguously this branch's.

Re-measured walking `translations/` recursively and resolving each `.po` by
basename across all of `docs/`:

| | stale msgids, 56 catalogues |
|---|---|
| `main`'s extractor | **281** of 4987 |
| with this fix | **284** |
| after the repair | **281** |

The fix stranded exactly **three** — the same `/prepare-merge` gate-list string in
`ar`, `ru` and `fr/agent-onboarding.po`, keyed as `contentvalidate / qasweep /
proofstatus / latexpreflight / lean_build`. `lean_build` survived even then, being
the odd underscore with no partner.

**The repair is three keys, not three translations.** One line each, `msgid` only.
Nothing needed translating: `ar` and `ru`'s msgstrs already carry the correct
`content_validate` and `qa_sweep`, `fr`'s is empty, and the PUBLISHED pages were
always right. Only the derived key was corrupted, by our own extractor. Sidecars
regenerated to ar 69/80 and ru 69/80 — their pre-fix values, so the fix costs
nothing in measured coverage.

**281 msgids were already stale before any of this work** — `kg-viewer.po` is 40 of
40 stale across five locales, `glossary.po` 8 of 8. A different and larger figure
than the 3785 `lvk9` tracks, and input for the combined pass rather than this
bean's business.

## Gates

`translation:drift:check`, `translation:pot:check` and `translation:index:check`
each exit 0 — drift compares heading STRUCTURE rather than msgids, which is why
a msgid change does not move it.

## Summary of Changes

Merged in PR #1433 as `c6960465301`. Verified on `main` rather than reported:
`cat-harness/content/pipeline/pot-extract.ts:92` carries

    const MD_ITALIC_UNDER_RE = /(?<!\w)_([^_]+)_(?!\w)/g;

and on `main` `$a_1$ and $b_2$` survives intact while `say _this_ and _that_`
still strips to `say this and that`.

| | |
|---|---|
| corrupted msgids, `cat-harness/docs` | 229 of 46435 → **0** |
| corrupted msgids, `qou/docs` | 13251 of 211139 → **0** |
| tests | 4 added; **3 measured RED** with the old regex |
| stranded catalogue keys | 3, repaired; stale count back to `main`'s 281 of 4987 |
| measured coverage | unchanged — ar 69/80, ru 69/80 |

**The shipped spelling is `\w`, not `[_\w]`.** The class member was redundant —
JavaScript's `\w` is `[A-Za-z0-9_]` and already contains the underscore — and the
old spelling could not be displayed on GitHub, whose sanitiser eats the `!` from the
CDATA opener and so rendered the lookbehind INVERTED, three times, including in the
revision written to correct it. Equivalence checked rather than reasoned: identical
on 20 named cases, 200 000 fuzz strings, and 257 574 real msgids across both corpora.

## Two of this bean's own claims were wrong, and both are corrected above

1. **"No committed catalogue needs re-deriving."** Measured with scripts that
   resolved a catalogue's source as `join(DOCS, page + ".md")` — top-level pages
   only — so `translations/ar/agent-onboarding.po`, beside the NESTED
   `docs/guides/agent-onboarding.md`, was never in the set. Three catalogues were
   stranded. `translation:block-qa:check` caught it, red here and exit 0 on `main`.
2. **The regex as documented.** Three renderings in the PR description showed a
   lookbehind without its `!`. The code was correct throughout.

Both share a shape worth carrying forward: **an artefact that is wrong in a way that
still parses.** A mangled regex is a valid regex; a measurement over a subset returns
a clean number. In both cases what caught it was external — CI, or reading the stored
artefact back instead of trusting what had been submitted.

## What this bean does NOT contribute

The combined msgid obsoletion pass is `lvk9`'s remaining item and covers `6b8u`,
`ig4a`, `lvk9` and `3mo4` — **not** this bean. Measured: of the pages that carry a
committed catalogue, the fix changed the msgids of three, and those three are already
repaired here. Use the RECURSIVE staleness measurement for that pass, never the
top-level-only one that produced finding 1 above.
