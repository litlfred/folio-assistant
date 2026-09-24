---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Wireframe design review'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/wireframe-design-review.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/wireframe-design-review.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/wireframe-design-review.md){: .fa-edit-source }

{% raw %}
# Wireframe design review

Method: [`wiregen`](../../methodologies/wiregen.md). Process: [`processes/wireframe-design-review.bpmn`](../../processes/wireframe-design-review.bpmn). Owner, 2026-09-23: *"need both web and mobile layouts in usability reviews. wireframe is part of design process for adjudication"*.

## Where wireframes live

`cat-harness/docs/wireframes/<topic>/`. It holds:
- `intent.md`
- one HTML file per candidate
- `authors.json`, which reviewers are not shown
- `checks/`: screenshots and the checker's report
- `reviews/`: one file per reviewer

`cat-harness/docs/wireframes/index.json` maps every declared visualiser ref to the wireframe that covers it. `bun run check:wireframes` writes the QA sidecar from it (`test/results/wireframes.qa-results.json`) and fails on any gap.

## Two uses

| use | candidates | review |
|---|---|---|
| **Design**: a new or changed UI | at least two, compared blind | per-criterion, then adjudication, then options analysis |
| **As-is**: an existing visualiser, drawn as it renders on `main` | exactly one, marked `as-is` | the same criteria. A finding becomes a bean against the visualiser, not a redesign |

## 1. Intent

A few sentences: **who** the screen is for, **what they need to do**, and **what it must show**. For an as-is wireframe, the intent is read off the visualiser's own declaration and generator, not invented.

## 2. Candidates

- **Mid-fidelity HTML:** monochrome, **real content** from the graph it shows, semantic icons, and no placeholder text.
- **Web and mobile in every candidate**, through responsive CSS or two layouts. A candidate with one layout does not enter review.

## 3. Mechanical checks (Tool `wireframe-check`)

```sh
bun run wireframe:check cat-harness/docs/wireframes/<topic>/*.html --out cat-harness/docs/wireframes/<topic>/checks
```

This renders each candidate at web (1280×800) and mobile (390×844) sizes. It records `script` entries for *renders*, *no-overflow* and *no-placeholder*, each `pass` or `fail` with a note, and writes a screenshot per viewport. Any `fail` sends the candidate back to step 2.

## 4. Blind review, per criterion

Reviewers include at least one agent that did not author the candidate and one human. They see the intent, the screenshots and the HTML, without the authors. For each criterion they record `pass`, `warn` or `fail`, with a reason:

| criterion | question |
|---|---|
| intent-fit | Does it do what the intent says, for the person it names? |
| web usability | Can the task be done at desktop width? |
| mobile usability | Can the task be done at phone width, by touch? |
| accessibility | Contrast, a non-colour channel, accessible names, keyboard, reading order |
| alternatives | Do the candidates differ in the ways that matter? (Design use only) |

There are no scores and no averages (`methodology-adoption`, Refusals).

## 5. Adjudication and choice

- When entries for one criterion disagree, call **`Process_Adjudication`**. The adjudication leads, the checker's entry is kept, and a dispensation needs its reason.
- The choice between surviving candidates is **`Process_OptionsAnalysis`**. Rejected candidates stay, each with the reason it lost.

## Related

- [`theme-ui-review`](theme-ui-review.md): reviews the **built** result, also at both viewports.
- [`adjudication`](adjudication.md)
- [`methodology-adoption`](methodology-adoption.md)
{% endraw %}

## Processes that run this skill

This skill has its own process: **[Wireframe design review](../../processes/wireframe-design-review.html)**.

<img src="../../assets/img/workflows/wireframe-design-review.svg" alt="BPMN diagram: Wireframe design review" style="max-width:100%">

| process | step(s) that name it |
|---|---|
| [Wireframe design review](../../processes/wireframe-design-review.html) | Write the design intent; Produce >= 2 candidates, web + mobile; Mechanical checks, both viewports; Blind review per criterion |

