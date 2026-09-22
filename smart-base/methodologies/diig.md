---
$schema: folio-methodology/v1
name: diig
title: DIIG — Digital Implementation Investment Guide
origin: >
  World Health Organization, International Telecommunication Union and the
  United Nations Foundation Digital Health Initiative, *Digital implementation
  investment guide (DIIG): integrating digital interventions into health
  programmes* (2020), ISBN 978-92-4-001056-7. Ingested at
  `smart-base/library/9789240010567-eng/`; every citation below resolves to a
  section there.
applies-when: >
  Planning, costing and monitoring a DIGITAL HEALTH IMPLEMENTATION inside a
  health programme — from forming the team through to the budget and the
  monitoring plan. It is a programme-investment method, not a judgement method:
  it does not grade evidence (that is `grade`), does not choose between design
  options (`kepner-tregoe`), and does not constrain how a decision is recorded
  (`madr`). Reach for it when the question is *what shall we build, with whom,
  at what cost, and how will we know it worked* — and specifically when the
  answer has to survive a funder.
---

# DIIG — the investment path from a health system bottleneck to a costed plan

**Adopted whole, 2026-09-22, into `smart-base` rather than into the harness.**
`methodology-adoption` §4 places a method by ownership: a domain-neutral method
belongs to the harness, a domain method to the repository that owns the domain.
DIIG is WHO digital-health implementation, so it lives beside the corpus it was
read out of, and the directory lifts out with its declaration entry and nothing
else moves.

## What it is, in one sentence

A nine-chapter sequence taking a health programme from *we have a problem* to
*we have a budgeted, governed, monitorable digital implementation*, in which
each chapter's output is the next chapter's input.

## The nine chapters, as the Guide numbers them

| | chapter | what it produces |
|---|---|---|
| 1 | Introduction | scope, key terms, and when the Guide applies |
| 2 | Form the team and establish goals | roles and responsibilities; a shared statement of the programme's needs and goals; an understanding of operations across levels of the health system |
| 3 | Identify health system challenges and needs | a map of the current state, bottlenecks confirmed and prioritized, and those bottlenecks mapped to generic health system challenges |
| 4 | Determine appropriate digital health interventions | selected interventions, an enabling-environment assessment, functional requirements and user stories, a future-state workflow |
| 5 | Plan the implementation | infrastructure; legislation, policy and compliance; leadership and governance; workforce and training; services and applications |
| 6 | Link the digital health implementation to the enterprise architecture | an assessment of the architecture, the common and enabling components (the digital health platform), and the investment linked to both |
| 7 | Develop a budget | phases of implementation, cost drivers, a budget matrix |
| 8 | Monitor the implementation and use data effectively | a logic model, an M&E plan, a culture of data use, adaptive management |
| 9 | Value proposition and next steps | the case made to whoever pays |

Chapters 4 and 8 close with a **progress check** — the Guide's own gate, not one
added here.

## It builds on CRDM, and this platform already carries CRDM

Chapter 3 says so in its own words:

> This process builds on the Public Health Informatics Institute's
> Collaborative Requirements Development Methodology (CRDM), a commonly used
> approach for defining the problem, identifying how it could be improved, and
> describing how the improved process would need to function (50).
>
> — `library/9789240010567-eng/sections/page-043.md` (PDF page 43, printed
> page 31), introducing *Fig. 3.1. Adaptation of CRDM approach for defining
> health system challenges*

CRDM's three areas of concentration, verbatim from the same page:

1. **Business process analysis**
2. **Business process redesign**
3. **Requirements definition**

**This is a real join, not a resemblance.** `cat-harness/methodologies/crdm/`
carries the CRDM adoption this platform already runs, including
`crdm-needs.bpmn` and `crdm-requirements-definition.bpmn`, whose names are two
of those three areas. So DIIG Chapter 3 and the platform's own requirements
process descend from one published method, and an agent working a DIIG
implementation is in a lane the harness can already execute.

**What that join does NOT license.** DIIG *adapts* CRDM for health system
challenges; it does not restate it. Where the two disagree, neither overrides
the other and they are not merged — `methodology-adoption`'s first refusal is
that a composite is a house method that cites nobody and inherits none of their
authority while claiming all of it. Pick one per decision, name it, follow it.

## Where this adoption stops

**Stated, because a silent omission misrepresents the standard.**

- **The annexes are named, not rendered.** DIIG ships fourteen worksheets and
  templates — the planning and implementation charter, the persona worksheet,
  the process matrix, the budget template, the logic model template, the
  adaptive management checklist, and more. They are instruments a *programme*
  fills in, not steps an agent performs, and reproducing them here would put a
  second copy of a WHO worksheet in a platform repository. They are cited to
  the ingested sections instead.
- **The figures are largely not available.** DIIG's conceptual figures are
  drawn in vector, and `pdf-images.py` recovers the raster layer, so Fig. 3.1
  and its siblings were never extracted. Bean `m4xy` carries the finding. Where
  this file describes a figure it is describing the *text around it*, and says
  so.
- **Chapter 5's country-specific and intervention-specific considerations**
  (Annexes 5.3, 5.4) are a reference table of scale, not a method. Left in the
  library.

## Refusals

`methodology-adoption`'s four refusals bind. Three are inherited unchanged; the
third has a concrete, named target in this method and is the one a later agent
will breach first.

**Never quantify a judgement to make it look measured — and here is where.**
DIIG Table 3.3.1, *Formula for scoring and ranking bottlenecks*
(`sections/page-050.md`, PDF page 50, printed page 38), scores each bottleneck
on three criteria, each 1–3:

1. How much impact does this bottleneck have on the process?
2. What is the likelihood of overcoming this bottleneck?
3. Is this important to a wide range of stakeholders?

— and combines them into a **Score** and a **Prioritized Ranking**.

**This platform adopts the three criteria and refuses the arithmetic.** The
criteria are the method's real contribution: they name what makes a bottleneck
worth attacking, and they are answerable. The total is not a measurement. Three
ordinal judgements on incommensurable scales, summed with equal weight, produce
a number whose precision is invented — and a ranked list reads as evidence in a
way three stated judgements do not. So an agent applying DIIG Chapter 3 records
each criterion's answer **and its reason**, and orders the bottlenecks by
argument; it does not print a score.

This is the same rule as never quoting a count from prose as though it were
evidence, and DIIG itself is not harmed by it: the Guide's own text asks the
three questions, and the table is how it suggests tallying them.

**Never let a rejected option go unrecorded.** DIIG Chapter 4 selects
interventions against prioritized challenges. The interventions considered and
not chosen are part of the output, with why — the same argument `scrapped` wins
on for beans, since a deleted alternative leaves the next reader unable to tell
a decision from an oversight.

**Never adopt a methodology by naming it.** A DIIG citation with no rendered
step is an appeal to authority no reader can check.

**Never blend DIIG with CRDM, MAPS or the M&E guide.** All four are in
`smart-base/library/` and all four touch digital health implementation. They
are parallel tracks selected by context, not a toolkit to assemble from.

## Its neighbours in this library, and what each is for instead

| | |
|---|---|
| Classification of Digital Health Interventions (v1.0, v2.0) | the controlled vocabulary DIIG Chapter 4 selects *from*; not a method |
| Digital transformation handbooks (primary health care; substandard and falsified medical products) | DIIG applied to one domain — worked instances, not the method |
| The MAPS Toolkit | assessment and planning for **scale**, which begins where DIIG's first implementation ends |
| Monitoring and Evaluating Digital Health Interventions | the full treatment of what DIIG Chapter 8 compresses into one chapter |
