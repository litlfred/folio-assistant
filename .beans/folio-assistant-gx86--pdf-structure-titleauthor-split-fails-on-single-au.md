---
# folio-assistant-gx86
title: pdf-structure title/author split fails on single-author bylines
status: completed
type: task
priority: normal
created_at: 2026-08-24T17:28:23Z
updated_at: 2026-08-24T19:48:24Z
---

Found while ingesting qou's 9 un-ingested uploads (2026-08-24). **1 of 9 titles came out correct.** That is far below the 96.7% the whole-corpus run in folio-assistant-p2en reported, so either the rate is uneven by layout or the corpus figure counts 'non-null' rather than 'correct'.

## One predicate causes both failure directions

scripts/pdf-structure.py:119

    RE_AUTHOR_HINT = re.compile(r"(,\s|\band\b|\&)", re.I)

parse_front_matter() only treats a line as the byline when it contains a comma-space, the word 'and', or an ampersand. So:

**(a) Single-author bylines are never recognised** — no comma, no 'and' — and get appended to the title. 6 of 9:
  - 'FLOER COHOMOLOGY AND PENCILS OF QUADRICS IV AN SMITH'  (Ivan Smith)
  - 'FLOER COHOMOLOGY AND HIGHER MUTATIONS SOHAM CHANDA'
  - 'Floer cohomology , singularities, and birational geometry Mark McLean'
  - 'Along exact sequence for symplectic Floer cohomology Paul Seidel'
  - 'A FOURIER-FREE DENSITY-INCREMENT PROOF OF ROTH'S THEOREM MARK LEWKO'
  - 'On the generalisation of Roth's theorem Paolo Dolce Francesco Zucconi 0 Introduction 1 0.1 History . . .' (two authors, no comma/and — then ran on into the TOC)

**(b) A title continuation containing 'and' is misread AS the byline**, truncating the title. 1 of 9:
  - arxiv-1109.3255v2 title='FLOER COHOMOLOGY IN THE MIRROR OF THE PROJECTIVE', authors_raw='PLANE AND A BINODAL CUBIC CURVE'
  The real title is 'Floer cohomology in the mirror of the projective plane and a binodal cubic curve'; the byline (James Pascaleff) was lost entirely.

**(c) Body text swallowed** where there is no byline at all: roth-lemma title is a whole paragraph ('Chapter 5 ROTH'S LEMMA 1. Introduction Roth bases the proof...').

Correct: noniterativeroth2 only — 'ERNIE CROOT AND OLOF SISASK' contains 'AND', so the hint fired.

## Why it matters beyond cosmetics

The mangled title is what library/INDEX.md shows and what is injected as doc_title into every sections/*.md front-matter, i.e. into the contextual-retrieval tier. 'Along exact sequence for symplectic Floer cohomology' hid Paul Seidel's long-exact-sequence paper from exactly the arc that went looking for long exact sequences (qou bean qou-fngs).

## Fix direction (not attempted here — corpus-wide blast radius)

A byline is better identified positively than by punctuation: a short line of capitalised name-like tokens, no verb, no title-case function words, optionally attested by the running heads / bibliography via the `vocab` Counter that `rejoin_caps` already builds. Any change re-titles ~373 documents, so it needs a before/after diff reviewed as its own pass, not a drive-by.

Interim: the 9 titles were corrected as data in the qou repo, and a pdf-structure.py re-run will revert them until this is fixed.


---

## Fixed and measured — 432f8b7, 2026-08-24

`looks_like_byline` no longer identifies a byline by punctuation alone. Three
changes, each isolated by a corpus-wide A/B over all 382 library documents:

- a **name-shape route** for the single-author byline that carries no
  punctuation, gated by an **abstract veto** (a line whose capitalised words are
  mostly already in the abstract is title text);
- `RE_SPLIT_CAP` now requires the *tail* to be unattested as well as the join,
  because gating on the join alone welded "A long" into "Along" — `along` is on
  every page of a symplectic paper;
- `RE_TITLE_STOP` plus book-division furniture ("Chapter 5") stops a title that
  no byline stops.

Two scoping decisions came out of the A/B and were wrong first: the abstract
veto applies to the punctuation route **only when there is no comma** (vetoing
the comma case cost 40 titles their stopping point), and the <=8-token cap applies
to the shape route **only** (real bylines are messy — "Ma..ite Dupuis1,* and
Florian Girelli 2, 1,+" is nine tokens of kerning damage and affiliation
markers).

**Final A/B over 382 documents: 46 titles improved, 8 regressed; 73 bylines
recovered, 7 lost.** An earlier measurement reporting 88 regressions was wrong —
it compared fresh extraction against *stored* titles, many of which are
hand-curated and no extractor ever produced them. Do not re-derive the baseline
that way.

## Closing this, and what carries on

The titled defect — single-author bylines never recognised — is fixed and
measured net-positive, so this bean is done.

The residue is **not** dropped. `folio-assistant-whwf` carries it, with the 7
lost bylines enumerated: 2 are actually corrections (the old "byline" was title
text, so the true score is 73 recovered / 5 lost), 5 are genuine regressions on
comma-less multi-author bylines, 2 of those 5 have a confirmed cause in the
abstract veto, and 3 do not yet. It also records the operational point this bean
raised and could not close: **qou's `library/*/structure.json` still holds
pre-fix output**, so the 9 hand-corrected titles are still hand-corrected and
the 5 regressions are latent until someone re-runs the extractor.
