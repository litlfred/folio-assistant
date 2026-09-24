---
layout: default
title: 'Two moments, and this skill is used at both'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/theme-ui-review.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/theme-ui-review.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/theme-ui-review.md){: .fa-edit-source }

{% raw %}
# Two moments, and this skill is used at both

**Owner, 2026-09-23**, settling bean `9fdi`:

> theme review to ingestion of graphical assets in context of website or app
> design and determining graphical assets/UI

So theme review happens **twice**, over two different objects, and reading this
skill as post-MVP *only* is what left it carried by no role at all:

| moment | what is under review | where |
|---|---|---|
| **at ingestion** | the **arriving art** — is this a usable graphical asset, does a signal survive without its colour | `ingest-theme.bpmn` `Task_Review`, inside the unattended engine |
| **post-MVP** | **what actually renders** — inventory, accessibility, branding, every declared locale | `theme-ui-review.bpmn`, called from `crdm-deliver.bpmn` on the edge out of stakeholder acceptance |

The ingestion moment is not a weaker version of the other one. It asks a
question the post-MVP review **cannot** ask, because by then the answer is
already baked in: *what are the graphical assets and the UI going to be?*
Determining an asset is ingestion work. That is why it runs unattended and why
`ingestion-agent` carries this skill.

The post-MVP moment asks the question the ingestion one cannot: *what did this
turn into?* Nothing about accepting a crop tells you how it reads at 320px in
Arabic over a photograph.

**Neither replaces the other, and the rest of this file is the post-MVP half.**
The paragraphs below were written when that was the only half, so where they say
"post-MVP" they mean the second row of the table, not the whole skill.

# Post-MVP, because there is nothing to check before there is a render

The owner, 2026-09-20: theme choice is *"authoring (human/agentic)
decision/judgement"*, and reviewing themes and UI *"should be part of post MVP
process in SDLC"*.

Those two go together. Because there is **no role-to-theme mapping**
([`theme.ts`](../../schemas/theme.ts) records why), there is no table to audit,
no binding to verify, nothing a build-time gate could assert. A theme is chosen
per note by whoever writes it. What *can* be reviewed is the result, and only
once there is one — which is why this hangs off MVP acceptance in
`crdm-deliver.bpmn` rather than sitting in the requirements phases.

## Measure; do not assert

**Contrast is computed, against the real ground.** A theme with a backdrop has
no single ratio — ink over a photograph varies pixel to pixel — so the number
that matters is the worst case the art can present. Every shipped scrim in this
repository is measured over **pure black** for that reason, and the check is
written so it *can fail*: without a case that fails at a thin scrim, passing
assertions prove nothing about the value.

**Colour is never the sole carrier** (SC 1.4.1). Where it carries meaning, look
for the second channel — the priority stripe is a *width* as well as a hue
precisely so a monochrome reader still sees it.

**An automated pass is necessary and not sufficient**, and this is the part that
gets skipped. Two measured cases from this repository:

- axe accepts a **non-empty placeholder** as an accessible name, so a label
  removed from the accessibility tree passed the automated check and was found
  by reading the real output.
- A CSS selector that matches **nothing** raises no error in any tool. One
  wrong combinator put a backdrop at its intrinsic 1672px across the viewport,
  with the suite green, every gate green and every request returning 200.

So a person looks at the rendered page. That is a step in the diagram, not an
optional extra.

## Branding is a question about the INSTANCE, not about taste

Marks, palettes and art are checked against the instance's own declaration
rather than a remembered style. The sharpest form of the question comes from
downstream: **would a folio depending on this platform inherit something it did
not choose?** `landing.html` states it as a rule — *"a downstream folio should
not inherit a grumpy cat it did not choose"* — and it is why a theme names an
image **role** rather than a path.

## Languages: new UI is where untranslated strings enter

Not because anything went stale, but because nothing was there before. Check
that every user-facing string reaches the `.pot`, that each declared locale
renders without clipping, and that right-to-left is **laid out** rather than
mirrored by accident.

The distinction worth keeping: a **name** is translatable and a **value** is
not. A theme's display name goes through the pipeline; its palette does not,
because a colour is not language-dependent and translating one invites a locale
to diverge on a value the CSS must agree on.

## Raise findings; do not fix them

A finding goes back to whoever authored the choice, **because the choice was
theirs**. There is no mapping to correct instead, and a reviewer who quietly
re-themes a note has substituted their judgement for the author's without saying
so — which is the same objection [`decision-audit`](decision-audit.md) makes to
editing a finding rather than overruling it with a note.

The one exception is the one this repository already allows everywhere: a defect
that is not a judgement call at all — a selector matching nothing, a string
missing from the `.pot`, a contrast ratio below the floor — is a bug, and bugs
get fixed.

## What this does NOT cover

Not the choice itself. Whether a sticky should be `engineer` or `library` is an
authoring decision, and this review does not second-guess it; it asks whether
what was chosen **renders legibly, consistently and in every declared
language**.

## Both viewports, always

Owner, 2026-09-23 (issue #1023): *"need both web and mobile layouts in usability reviews"*.

- Every surface is inventoried and judged at a **web** width and at a **mobile** width.
- A review done at one width is **incomplete**, not passed.
- The surface's wireframe, in [`wireframe-design-review`](wireframe-design-review.md), states what each layout was meant to be, so the review compares the build against an intent rather than against memory.
{% endraw %}

## Processes that run this skill

This skill has its own process: **[Post-MVP theme and UI review](../../processes/theme-ui-review.html)**.

<img src="../../assets/img/workflows/theme-ui-review.svg" alt="BPMN diagram: Post-MVP theme and UI review" style="max-width:100%">

| process | step(s) that name it |
|---|---|
| [Ingestion subprocess — ingest a theme](../../processes/ingest-theme.html) | Review contrast and non-colour signal |
| [Post-MVP theme and UI review](../../processes/theme-ui-review.html) | Inventory what actually renders; Accessibility: measure, do not assert; Branding: does it read as this instance?; Languages: extracted, rendered, and RTL; Raise findings against the authoring |

