---
$schema: folio-methodology/v1
name: grade
title: GRADE — Grading of Recommendations, Assessment, Development and Evaluation
origin: >
  The GRADE Working Group (gradeworkinggroup.org); Evidence-to-Decision
  frameworks per Alonso-Coello et al., BMJ 2016. WHO applies it through the
  *WHO Handbook for Guideline Development*.
applies-when: >
  Certainty of evidence for a HEALTH RECOMMENDATION, over a body of evidence
  answering one PICO question. Not for platform or architecture decisions — those
  are `kepner-tregoe`, recorded per `madr`.
---

# GRADE — certainty of evidence, and the recommendation that rests on it

**Adopted whole, 2026-09-20, and placed in `smart-kg` rather than the harness.**
Certainty-of-evidence grading belongs to WHO L1 guideline development, not to an
agent framework: a folio formalising mathematics has evidence and no use for
GRADE, which is why this is a separate, extractable sub-graph.

## It has a slot waiting

`processes/evidence-retrieval.bpmn` already frames the question as PICO,
retrieves candidates across three classes, and runs `Task_AppraiseGrade` —
*"Certainty of evidence per the grading system the folio declares. The grade
attaches to the BODY of evidence for one PICO question, not to an individual
citation."*

Its own documentation says: **"STRAWPERSON: registries, grading system and API
bindings are not fixed here."** GRADE is one grading system that fits that slot.
The slot stays pluggable — that is the point of adopting the method as a sub-graph
rather than wiring it into the diagram.

## Certainty, in four levels

**High · Moderate · Low · Very low** — the certainty that the true effect lies
close to the estimate. Randomised trials start High and observational evidence
starts Low; then:

**Rated down for** risk of bias, inconsistency, indirectness, imprecision,
publication bias.
**Rated up for** large effect, dose-response, or where plausible confounding would
have reduced an observed effect.

**The grade attaches to the body of evidence per outcome, never to a citation.**
A single paper does not have a GRADE. This is the distinction the BPMN task
already encodes by sitting after the join rather than inside the fan-out, and it
is the one most often got wrong.

## Evidence-to-Decision: certainty is one domain of several

A recommendation does not follow from certainty alone. The EtD framework judges,
each explicitly: problem priority · desirable effects · undesirable effects ·
certainty · values · balance of effects · resources required · equity ·
acceptability · feasibility.

Then a recommendation with a **direction** (for / against) and a **strength**
(strong / conditional). **Strength is not certainty.** A strong recommendation can
rest on low-certainty evidence when the balance of effects is decisive, and a
conditional one can rest on high certainty when values differ across populations.
Conflating the two is the most common misreading of GRADE, and the reason the two
words are separate fields rather than one score.

## What this platform must not do with it

- **No numeric aggregation of EtD domains.** The framework judges each domain and
  argues the recommendation; it does not sum them. A weighted total would be the
  MCDA failure this platform refuses elsewhere — a judgement laundered into a
  measurement.
- **`could not determine` is not `very low`.** Absent evidence and low-certainty
  evidence are different findings with different actions. `evidence-retrieval`
  already models this correctly with `EndEvent_GapRecorded` — *"Gap recorded, no
  recommendation"* — as a distinct terminal from an evidence-backed one.
- **No empirical claim enters a formal proof.** A graded body of evidence supports
  a recommendation, never a theorem. In a paper folio the two live in different
  block kinds and must not be joined.

## Refusals

- **Never grade a single citation.** The body, per outcome.
- **Never report a recommendation without its direction and strength.** One
  without the other is not a GRADE recommendation.
- **Never table it in DMN.** See [`dmn`](../../cat-harness/methodologies/dmn.md) —
  tabling asserts repeatability the method denies.
