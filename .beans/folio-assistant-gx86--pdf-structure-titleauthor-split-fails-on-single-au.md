---
# folio-assistant-gx86
title: pdf-structure title/author split fails on single-author bylines
status: todo
type: task
priority: normal
created_at: 2026-08-24T17:28:23Z
updated_at: 2026-08-24T17:28:42Z
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
