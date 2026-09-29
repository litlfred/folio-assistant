---
# folio-assistant-7e59
title: 'INGEST: decision-making methodologies — skill takes decision context as input, outputs ranked applicable methods with criteria and rationale. Source: qou bd0c2cb7 (3 arxiv PDFs: 2508.21620 probabilistic/bandits, 2509.06388 MCDM/AHP/SAW, 2607.20636 sequential/social). Covers all methodology families with when-to-use criteria.'
status: in-progress
type: task
priority: normal
created_at: 2026-09-25T15:38:03Z
updated_at: 2026-09-29T22:52:09Z
parent: folio-assistant-slw1
---

A skill that takes a **decision context** as input and returns the applicable
methodologies, **ranked**, each with its selection criteria and the rationale
for the ranking — rather than one methodology asserted as correct.

`cat-harness/skills/folio-core/decision-methodology-selector.md` landed on
`main` ahead of its sources, together with the four generated or declared
siblings that make it findable.

## 2026-09-29 — the sources are in, and the coverage claim is CHECKED

All three were uploaded by the owner in `c8349950` and are now ingested and
promoted, each with a methodology node citing it (`library-ref.test.ts`
requires one, which is why the ingest and the nodes had to land together):

| slug | source | node |
|---|---|---|
| `arxiv-2508.21620v2` | Kristiadi, probabilistic decision-making algorithms | `probabilistic-decision-analysis` |
| `250906388v1` | Wang & Rangaiah, aggregation-type MCDM, chapter 8 | `mcdm-aggregation` |
| `arxiv-2607.20636v1` | Ravichandran, sequential decision-making and social epistemology (thesis) | `adequacy-for-purpose-modelling` |

`250906388v1` is not a mangled arXiv slug. That copy is the authors'
preliminary Word manuscript with no arXiv stamp, so `_pdf_doc_id.py` fell back
to the basename exactly as designed; the node records the arXiv id to cite and
says the slug is a filing key. **Open question for the owner: rename it to an
author-year slug** (`wang-rangaiah-2026-mcdm-aggregation`, the convention the
three non-arXiv entries already follow) **or leave it.** Cheap now, a sweep of
`evidence:` lines later.

## The title's coverage claim is NOT supported by the sources

> *"Covers all methodology families with when-to-use criteria."*

Checked against the three, rather than asserted:

- **The MCDM source covers ONE MCDM sub-family, and says so in its own
  abstract**: *"selected aggregation-type"* methods, eight of them. Outranking
  (ELECTRE, PROMETHEE) and distance-based (TOPSIS, VIKOR) are absent — TOPSIS
  appears in the chapter only inside a reference title. It is chapter 8 of a
  volume, so the companion families are somebody else's chapter.
- **The probabilistic monograph** covers bandits, Bayesian optimisation and
  tree search. Not MDPs, not RL generally, not decision trees or influence
  diagrams.
- **The thesis** contributes two specific settings plus a modelling essay; only
  the essay is adopted as method.

So the three sources together leave at least outranking MCDM, distance-based
MCDM, expected utility under ambiguity, cost-benefit analysis and most of
social choice unrepresented. **The selector should say what it does not
cover**, which is the same rule its own output already follows for `not-for`.

## Done when

- [x] the three sources ingested, promoted and cited (2026-09-29)
- [x] the "covers all methodology families" claim checked against the three
      sources — it is not supported, and the gap is named above
- [ ] the author replaces this body with the real scope
- [ ] the skill's ranking output has a schema, or a stated reason it does not
- [ ] the selector declares the families it does NOT cover, so an agent asking
      for an outranking method is told none is here rather than given the
      nearest aggregation one
- [ ] owner's call on the `250906388v1` slug
