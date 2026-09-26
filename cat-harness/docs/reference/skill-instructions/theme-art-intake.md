---
layout: default
title: 'Theme art intake'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/theming/theme-art-intake.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/theming/theme-art-intake.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/theming/theme-art-intake.md){: .fa-edit-source }

{% raw %}
# Theme art intake

Art arrives — three crops for a theme or an avatar — and the answer is either
**accepted, with the declaration written**, or **refused, with what to fix**.

> make skills for avatar theme ingestion (need 3 meeting certain formatting
> constraints), return sucches or explnation of falire
>
> …make as part of docuemtn ingestion skill.
>
> — owner, 2026-09-20

## This is a step in document ingestion, not a process beside it

Document ingestion already answers the question art arrival poses — *something
unstructured has arrived; is it acceptable, and if not, why not* — and already
has the shape of the answer: a pipeline with a completeness gate. Theme art is
the same event with a different payload.

So what exists is a **check keyed on the payload**, not a second pipeline. A
parallel "avatar ingestion" would be a second answer to one question, free to
disagree with the first.

| | where |
|---|---|
| the check | `schemas/theme-art-intake.ts` — pure, no I/O, no clock |
| the CLI face | `scripts/check-theme-art.ts`, `bun run check:theme-art` |
| the arrival | `uploads/`, per `content-acquisition` and `document-intake` |

## Every constraint was paid for

Each one is a failure this repository actually took. Do not add a constraint
here that has not cost something — a rule with no incident behind it is a rule
whose next maintainer cannot tell whether it still matters.

| constraint | verdict | the incident |
|---|---|---|
| all three layouts | **refuse** | `landing-architecture` shipped laptop + card and **no mobile** from 2026-09-20 to 2026-09-24. `resolveThemeBackdrop` refuses an incomplete backdrop *wholesale*, so the theme renders with **no** art — not two thirds of it. |
| distinct content | **refuse** | commit `1b62b57` delivered three files of which **two were byte-identical** (same digest, both 1,606,269 bytes): two distinct images for three named avatars. |
| orientation per layout | **refuse** | a portrait crop is not a landscape crop scaled down. The quiet area the sticky's text sits in moves. |
| a declared destination | **refuse** | commit `0301fbd2` put three PNGs at the **repository root**, undeclared, with spaces and commas in the names. No gate saw them: `check-declared-assets` walks declared→disk, and the root is not an instance. |
| dimensions measured | *structural* | `landing-engineer` is declared 1672×941 where its siblings are 1671×941 — one pixel, copied from a neighbour. Intake takes bytes and **emits** the declaration, so there is nowhere for a retyped number to enter. |
| weight and format | **report** | the arriving PNGs are 1.5–2.3 MB against ~100 KB webp. Heavy art still renders, so refusing it would block work over a bandwidth judgement. |

## Refuse, report, or neither — and the line matters

- **Refuse** when the art cannot do its job, or when intake cannot tell which of
  two readings is intended. A missing crop and two identical files are both
  "somebody has to decide something".
- **Report** when the art works but costs. Weight and format are the cases: a
  1.6 MB PNG renders correctly.
- **Neither** — say nothing — for anything intake did not actually measure.

A refusal that says *invalid* teaches nobody what to fix, so `remedy` is a
required field on every failure, not an optional one. All failures are collected
rather than thrown one at a time: art arrives as a batch, and reporting the first
problem of three means three round trips to learn three things.

## Do not repair somebody's art

`deletion-requires-confirmation` applies, and so does its spirit. When intake
refuses, the outputs are **the report and a work-plan item** — not a re-crop, not
a converted file, and not a quietly removed declaration. What looks like a
missing crop may be a duplicate that was uploaded by mistake, and that is a
question for the person who has the original.

`check:theme-art:check` was held back from CI for the same reason: it refused
`landing-architecture`, and a gate added in the same change as the check would
have made CI red over art that was missing rather than over a regression
somebody just introduced. The portrait crop arrived on 2026-09-24 and the gate
went in with it — a refusal now IS a regression.

## Reading the report

```
✓ landing-engineer: 3 layouts accepted
  · laptop 1672×941 docs/assets/img/harness/landing-engineer-laptop.png
  ! [heavy] laptop: … is 1560 KB, over the 391 KB budget
      → convert to webp — the measured gap on this art was about 16×

✗ landing-architecture: refused, 1 problem(s)
  · [missing-layout] mobile: no file offered for the mobile layout
      → supply all three layouts …
```

Three rules for reading it, the same three `ci-health` states:

1. **`declared-but-absent` is not a refusal and not a pass.** The declaration
   names a file that is not on disk. It is reported on its own line because
   *"the file is not there"* and *"the file is the wrong shape"* are different
   facts, and a reader who cannot tell them apart fixes the wrong one.
2. **A check that fires on every subject is wrong.** The first run of
   `check-theme-art` refused all five roles for `undeclared-destination`,
   because `docs/` is not a declared directory — and it should not be: a
   declared entry names a *graph*, and the site is the render *target*. The
   check was corrected, not the repository.

   **This one is general, and it has now been paid for twice.** The rule is
   stated here because this is where it was first measured, not because it is
   about art. Second instance, 2026-09-20: the first run of
   `check-escaped-markup` found the landing-page defect it was written for **and**
   two pages that are simply correct — `translation-support.html` documents the
   path `&lt;section&gt;/&lt;block&gt;/…` and `md-authoring.html` quotes
   `&lt;table class="md-table"&gt;`, both inside `<code>`, which is how a document
   shows markup to a reader. 19 findings; 6 were real. Blanking `<code>` and
   `<pre>` regions took it to 6/6, and the exclusion is tested in **both**
   directions, because a test that only checks the excluded case passes equally
   for a check that never fires at all.

   So when you write a check and its first run lights up broadly, the first
   question is *which of these are correct?* — not *how do I fix the repository?*
   A check that fires on legitimate subjects is a check somebody switches off,
   and a switched-off check is worse than none because it reads as coverage.
3. **Warnings do not accumulate into a refusal.** Twelve heavy files are twelve
   reports, not a failure. Weight is `ll11`'s subject.

## Adding a constraint

1. Name the incident. No incident, no constraint.
2. Decide refuse vs report by the line above — *can the art do its job?*
3. Write the `remedy` before the detection. If you cannot say what to do about
   it, the check is not ready.
4. Prove it fires, with a test that fails when the check is removed.
5. Check it against **art already shipped**. The aspect bands are deliberately
   wide because the shipped laptop crops run 1.50–1.78; a tighter band would
   have looked rigorous and refused work that is fine.

---

## The structure this grows into

The owner chose the axis on 2026-09-20, as **"1 + 2, then specialized to 3"** —
three levels rather than a choice between three options:

1. **Pipeline stage** is the primary division — **intake → declaration →
   generation → contrast**. This is how the failures actually arrived: each of
   the four rounds of *"still not image"* was one stage.
2. **Producer vs consumer** cross-cuts it, saying which direction a stage
   faces. It is what makes *"a theme with no CSS rule falls back to an opaque
   surface and paints over its own art"* a **consumer** fact rather than a
   generation detail.
3. **Per artefact** is the specialisation, last and narrowest — sticky, landing
   board, docs background, navbar avatar. Specialised rather than duplicated:
   the general rule lives in its stage and the artefact package carries only
   what differs.

**The ordering matters more than the names.** Artefact-first would duplicate
intake and contrast into every artefact, which is the shape that put the scrim
rule in one skill's prose and let it be rediscovered rather than read.

## Why this is one package today and not four

**Measured before splitting: the corpus is three skills.** Four stage packages
over three skills would declare directories with nothing in them — the `dh4f`
defect, where a consumer scans an empty tree and reports a clean run over it —
and this repository's own rule is to **declare only what exists**.

So the axis above is written down and the split waits for the content to reach
it. The move that *was* worth making now is the one that fixes findability: a
theming skill is no longer one of 107 general ones. When the stage packages
earn their own directories, the order is already decided and nobody has to
re-litigate it.

## What is NOT here

The theming **code** — `schemas/themes.ts`, `schemas/theme-art-intake.ts`,
`scripts/check-theme-art.ts`, `scripts/gen-themes-css.ts`,
`scripts/gen-avatars-css.ts` — stays where it is. This is the `kg` graph: the
instructions an agent follows, not the implementation. A skill and the code it
describes are different node kinds, and moving code to sit beside its
documentation is how a partition stops meaning anything.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Document ingestion — uploads/ to the L1 source knowledge graph](../../processes/document-ingestion.html) | Ingest the theme (calls a sub-process) |
| [Ingestion subprocess — ingest a theme](../../processes/ingest-theme.html) | Read the served stylesheet's declarations; Read the guide's own stated rules; Map values onto the shared palette ROLES; Record contradictions IN the source |

