---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Theming, split on the stage it fails at'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/theming/theming.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/theming/theming.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/theming/theming.md){: .fa-edit-source }

{% raw %}
# Theming, split on the stage it fails at

**Every file here is named for the skill it declares, and that is load-bearing
rather than tidy.** `servableSkills()` in `scripts/kg-audit.ts` derives a
skill's id from its FILENAME, while `package-manifest.json` lists its `name:` —
so a file whose basename differs from its `name:` is declared, present, and
reported as `manifest-skill-exists` because the two sides never meet. Measured
here on the first pass: six criticals, from six files named for their stage
instead of for their skill.

**Authored as a skill rather than as a `README.md`, and that is not a
formality.** `isSkillMd` is declaration-over-location: a markdown file in a
`cat-harness` directory that does not declare `$schema:` **is** a skill, so a
README here would enter the graph as one with no `name` to be fetched by. It
would also be the one orientation file an agent could not reach through
`skill_fetch`, which is the route `AGENTS.md` tells it to use.

**This is a PACKAGE under `skills/`, not a top-level declared directory**, and
the difference was paid for. Two sessions built this package independently on
2026-09-20: one relocated `theme-art-intake`, `create-sticky-note` and
`site-presentation-assets` out of folio-core into `skills/theming/`; the other
wrote the stage split, the visualiser and the documentation entry into a
top-level `cat-harness/theming/`. The merge kept both halves and took THIS
location on evidence — bean `lps0` measured that `kg-audit`'s `skillFiles()`
walks a hardcoded `skills/`, so a top-level topical directory silently drops
its skills out of skill QA, and `theme-art-intake` would have lost the sidecar
it has here.

## The axis, and the ordering matters more than the names

The owner, 2026-09-20, asked for theming skills *"broken up thematically"* and
then chose the axis: **"1 + 2, then specialized to 3"** — three levels, not a
choice between three options.

| | stage | faces | what it owns |
|---|---|---|---|
| 1 | [`theme-art-intake`](theme-art-intake.md) | **producer** | art arrives; accepted with its declaration written, or refused with a named reason |
| 2 | [`theme-declaration`](theme-declaration.md) | **producer** | what a theme IS as data — palette, three layouts, `textRegion`, `avatarRegion` |
| 3 | [`theme-generation`](theme-generation.md) | **consumer** | `themes.css`, and the fallback that paints over its own art |
| 4 | [`theme-contrast`](theme-contrast.md) | **consumer** | scrims, WCAG, and why the measurement is over pure black |
| — | [`theme-artefacts`](theme-artefacts.md) | specialisation | sticky, landing board, docs background, navbar avatar — only what DIFFERS |

**Stage is primary because that is how the failures actually arrive.** Four
rounds of *"still not image"* were one cause, and each round was one stage.

**Going artefact-first would duplicate intake and contrast into every
artefact** — the shape that put the scrim rule in one skill's prose and let it
be rediscovered rather than read. Stage-first with specialisation last means a
new artefact inherits the stages and declares only its difference. The avatar
crop boxes are the worked example: the *rule* that a crop is declared data
belongs to `declaration`, and the *boxes themselves* are navbar-avatar
specialisation in `artefacts`.

**Producer/consumer is not a second partition of the same set.** It says which
direction a stage faces. It is what makes *"a theme with no CSS rule falls back
to an opaque surface and paints over its own art"* a **consumer** fact rather
than a generation detail: the generator did its job, and the reader of a
missing rule is where it goes wrong.

## Which stage owns your question

| the symptom | the stage |
|---|---|
| art was rejected, or you do not know what to supply | `theme-art-intake` |
| "where do I put this number" — a crop box, a palette value, a layout | `theme-declaration` |
| the theme renders as a flat surface with no art | `theme-generation` — **run `bun run themes:css`** |
| text on art is hard to read, or you need a scrim ratio | `theme-contrast` |
| it is right everywhere except on one surface | `theme-artefacts` |
| a page flashes white (or light) before going dark on load | `theme-artefacts` §"The page ground: the first paint is DARK" |

## Why this directory exists at all

Theming was spread across places that do not name themselves as theming:
`schemas/themes.ts`, `schemas/theme.ts`, `schemas/landing-sticky.ts`, the
generated `docs-ui.css`, `themes:css`, `check:theme-art`, the scrim measurement
rules and the avatar crop boxes — with the discipline recorded in one skill's
prose and nowhere else. Bean `1hvo`.

**`skills/folio-core/theme-ui-review.md` deliberately did NOT move here.** It
is a UI review skill covering branding, languages and findings discipline;
theming is one of its subjects rather than its subject. A directory that takes
every file with `theme` in the name is a directory nobody can describe.

## Looking at it

`bun run theme:sheet` renders every theme — palette, measured contrast, and
each layout's art with its `textRegion` and `avatarRegion` drawn. It PRINTS and
never gates, because the question it answers is one no assertion can carry: the
schema can prove a box is square and inside the frame, and a box that is both
and still frames a patch of sky is exactly how two of the first seven avatar
crops shipped.
{% endraw %}
