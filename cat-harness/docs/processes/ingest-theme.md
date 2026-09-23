---
title: 'Ingestion subprocess — ingest a theme'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/ingest-theme.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Ingestion subprocess — ingest a theme

`Process_IngestTheme` · advisory · 5 step(s)

folio-assistant — Ingestion subprocess — ingest a theme. Source of truth: this file. Open it in bpmn.io, Camunda Modeler, or any other BPMN 2.0 tool. The SVG under docs/assets/img/workflows/ is generated from it by `bun run render:bpmn` — never hand-edit the SVG. The <folio:skill> extension on an activity names the folio-assistant skill that implements it; <folio:bean> marks a step that reads or writes the shared work plan in beans/. Bean j66n. One Theme node with kind sticky | webpage | publication, not three node kinds: the palette vocabulary is shared and only the GEOMETRY varies.

<img src="../assets/img/workflows/ingest-theme.svg" alt="BPMN diagram: Ingestion subprocess — ingest a theme" style="max-width:100%">

## How it connects

- **Called by:** [Document ingestion — uploads/ to the L1 source knowledge graph](document-ingestion.html)
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Ingestion Engine (agent, runs unattended) | — | Every step in this diagram is this lane's, and each treats the source as evidence to be recorded rather than resolved: contradictions in the source are kept as data rather than silently picked, values the source is silent on are marked as a choice rather than dressed up as a measurement, and a missing layout ends in refusal rather than a theme quietly degraded to the ones that were supplied. |

## Steps

Every one of the 5 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Read the served stylesheet's declarations**<br>`Task_ReadStylesheet` | Ingestion Engine (agent, runs unattended) | [`theme-art-intake`](../reference/skill-instructions/theme-art-intake.html) | Read the ROLE, never the prettiest value. Bootstrap's --blue is a scale entry and --primary is the role; DSpace sets them differently, and taking the brand-looking one is the hardcoding schemas/theme.ts exists to end. Column widths come from declared columns, never from breakpoints: a breakpoint is a viewport. |
| **Read the guide's own stated rules**<br>`Task_ReadGuide` | Ingestion Engine (agent, runs unattended) | [`theme-art-intake`](../reference/skill-instructions/theme-art-intake.html) | From the INGESTED document's sections, not from a screenshot and not inferred from a site that happens to use the brand. Units stay as the source gives them: rewriting 29.7cm as millimetres is a conversion nobody asked for and a chance to be wrong. |
| **Map values onto the shared palette ROLES**<br>`Task_MapRoles` | Ingestion Engine (agent, runs unattended) | [`theme-art-intake`](../reference/skill-instructions/theme-art-intake.html) | surface / ink / edge / accent, shared across every kind. A palette per kind would be three spellings of "accent colour", free to disagree about what an accent IS. Where the source is SILENT on a role, say so and mark the value a choice rather than dressing an invention as a measurement. |
| **Record contradictions IN the source**<br>`Task_Contradictions` | Ingestion Engine (agent, runs unattended) | [`theme-art-intake`](../reference/skill-instructions/theme-art-intake.html) | A step because it happened twice on the first real ingestion: the WHO guide states its black logo as both K:100 and R:100 G:100 B:100, and gives the logo blue as C:95 on page 6 and C:90 on page 12. A contradiction silently resolved is indistinguishable from one nobody noticed, so it is kept as data and the reading taken is stated as a choice. |
| **Review contrast and non-colour signal**<br>`Task_Review` | Ingestion Engine (agent, runs unattended) | [`theme-ui-review`](../reference/skill-instructions/theme-ui-review.html) | A theme sets the stripe's hue; it never sets its width to zero. Colour alone carrying a whole signal fails WCAG SC 1.4.1, and the WHO guide's own rule agrees ("Never red with green, never blue with yellow"). THIS IS THEME REVIEW AT INGESTION, and it is a different moment from the post-MVP one. Owner, 2026-09-23: "theme review to ingestion of graphical assets in context of website or app design and determining graphical assets/UI." What is under review here is the ARRIVING ART, and the question is what the graphical assets and the UI are going to be. That is why it sits inside the unattended engine: determining an asset is ingestion work, not a gate somebody stands at. What renders from those assets later is reviewed by theme-ui-review.bpmn, which cannot run yet because nothing has been built. |

## Decisions

Every one of the 2 decision(s) is documented.

| decision | what decides it | branches |
|---|---|---|
| **Served, or stated?**<br>`Gateway_Kind` | The ONE difference between the two paths. A deployed site SERVES its theme as a compiled stylesheet; a style guide STATES its rules as prose and swatches. Everything after the join is shared. | **served — a deployment** → Read the served stylesheet's declarations<br>**stated — a style guide** → Read the guide's own stated rules |
| **Every layout present?**<br>`Gateway_Layouts` | Is every layout the theme must cover present in the source? `yes` goes on to the contrast and non-colour review; `no` refuses the theme as incomplete rather than filling the gap by guessing. | **yes** → Review contrast and non-colour signal<br>**no** → Refused — incomplete |

{% endraw %}
