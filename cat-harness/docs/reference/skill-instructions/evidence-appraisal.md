---
layout: default
title: 'Evidence Appraisal'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/content-lifecycle/evidence-appraisal.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/content-lifecycle/evidence-appraisal.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/content-lifecycle/evidence-appraisal.md){: .fa-edit-source }

{% raw %}
# Evidence Appraisal

Appraise and grade a **body of evidence** against the grading system the folio
declares. This skill supplies the *procedure*; it does not supply the *system*.

## Why this skill names no grading system

`Task_AppraiseGrade` in `evidence-retrieval.bpmn` says the certainty is judged
"per the grading system the folio declares", and the diagram's header marks the
choice deliberately unfixed. That split is the right one and this skill keeps
it: **which** system applies is a methodological commitment belonging to the
folio and the body that publishes it. A platform that hardcoded one would be
writing subject matter into the harness — the failure `AGENTS.md` opens by
warning about — and every folio that uses a different system would then have to
work around the platform rather than with it.

So: the folio declares the system. This skill covers what appraisal *is*, what
it attaches to, and what has to survive as a record afterwards — the parts that
are the same whichever system you have declared.

## Responsibilities

- Appraise the **body** of evidence assembled for one question, not a citation
- Record the grade **with its reasons**, not as a bare label
- Distinguish "the evidence is weak" from "there is not enough to judge"
- Re-appraise when the body changes, and say what moved the grade
- Refuse to grade when no system is declared, rather than picking one

## The unit is the body, not the citation

The grade attaches to the body of evidence for **one PICO question**. This is
why `Task_AppraiseGrade` sits after the parallel join in the diagram and not
inside the fan-out: the three retrieval classes (trusted L1 sources, trusted
L2/L3 content, data repositories) contribute to one judgement, and grading each
branch separately would produce three numbers that answer no question anyone
asked.

A single citation does not carry a certainty grade. If you find yourself
writing one onto a reference, the unit has slipped.

## "Cannot appraise" is a third state

The same rule the rest of this platform follows. Three outcomes, and the third
is not a low grade:

| outcome | means |
|---|---|
| graded | the body was appraised and carries a certainty |
| **not appraisable** | too little retrieved, or no declared system, or the question was not framed as PICO |
| gap recorded | nothing authoritative was found, and that is the finding |

Collapsing "not appraisable" into the lowest grade is the defect worth naming:
it reads downstream as *"we looked and the evidence is poor"* when the truth is
*"we could not look"*. A recommendation resting on the first is weak; one
resting on the second is unsupported, and only one of those is honest about
what was done.

## Inputs

- The PICO question from `Task_FramePico` — without it the search is not
  reproducible and the appraisal is not checkable
- Candidates that passed `Task_VerifyAuthority`, so authority is a resolved
  fact rather than an assertion in the citation
- The grading system declared by the folio

## Outputs

- A certainty judgement for the body, in the declared system's own vocabulary
- **The reasons**, in enough detail that a later reader can tell whether they
  would still hold — this is what `decision-audit` exists for, and a grade
  without them cannot be reviewed, only re-litigated
- Any gap, recorded as a gap rather than as a low grade

## This has nothing to do with formal content

A graded body of empirical evidence is **never** an input to a mathematical
proof. In a paper folio, a `theorem`'s assertion is discharged by its `.lean`
sibling and by nothing else; certainty grading belongs to guidance about the
world, where the question is what the evidence supports. The two live in one
platform and must not meet: an empirical grade appearing in a proof obligation
would be a category error that the Lean build would not catch, because it never
reaches Lean.

If you are appraising evidence inside a paper folio, check first whether you
are in the right repository at all.

## Actors

- Author / guideline developer (lead)
- Clinical SME (domain judgement, where the question is clinical)
- Content Reviewer (checks the grade's reasons survive, not the grade itself)
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Evidence for a recommendation](../../processes/evidence-retrieval.html) | Appraise and grade the body of evidence |

