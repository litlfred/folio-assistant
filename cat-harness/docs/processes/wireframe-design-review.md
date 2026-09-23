---
title: 'Wireframe design review'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/wireframe-design-review.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Wireframe design review

`Process_WireframeDesignReview` · strict (defaulted) · 6 step(s)

WireGen (methodologies/wiregen) made executable: a written design intent, at least two mid-fidelity candidates each with a web AND a mobile layout, mechanical checks, a blind per-criterion review, adjudication where reviewers disagree, and a recorded choice. A wireframe is part of the design process for adjudication (owner, 2026-09-23). Operating skill: wireframe-design-review. Issue #1023.

<img src="../assets/img/workflows/wireframe-design-review.svg" alt="BPMN diagram: Wireframe design review" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** [Adjudication](adjudication.html), [Options analysis](options-analysis.html)

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Designer | `authoring-agent` | Writes the intent, produces candidates with real content, and runs the mechanical checks. Does not review its own candidates. |
| Feedback providers | `feedback-provider` | One or more reviewers (agent and human) who see candidates shuffled, without their author, and record pass, warn or fail per criterion with a reason. There are no scores and no averages. |
| Adjudicator | `adjudicator` | Reached only when entries for one criterion disagree. Settles the disagreement with a reason, and decides between surviving candidates through options analysis. |

## Steps

Every one of the 6 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Write the design intent**<br>`D_Intent` | Designer | `wireframe-design-review` | A short statement of who the screen is for, what they need to do, and what it must show. It is the criterion every candidate is judged against. |
| **Produce >= 2 candidates, web + mobile**<br>`D_Candidates` | Designer | `wireframe-design-review` | Mid-fidelity HTML: monochrome, real folio content, semantic icons, no placeholder text. Each candidate has both a web layout and a mobile layout. |
| **Mechanical checks, both viewports**<br>`D_Check` | Designer | `wireframe-design-review` | Tool wireframe-check renders every candidate at a web and a mobile viewport. It fails on horizontal overflow at mobile width, on placeholder text, and on a missing viewport, and writes screenshots and a script entry per criterion. |
| **Blind review per criterion**<br>`R_Review` | Feedback providers | `wireframe-design-review` | Criteria: intent-fit, web usability, mobile usability, accessibility, and alternatives considered. A review at one viewport only is incomplete. |
| **Adjudication**<br>`Call_Adjudicate` | Adjudicator | calls [Adjudication](adjudication.html) | folio-assistant's adjudication: the adjudication leads, the checker's entry is kept, and the dispensation carries its reason. |
| **Choose a candidate**<br>`Call_Choose` | Adjudicator | calls [Options analysis](options-analysis.html) | A one-off choice between surviving candidates. Rejected candidates are kept, with the reason each lost. |

{% endraw %}
