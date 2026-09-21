---
layout: default
title: Theming
parent: Architecture
nav_order: 7
---

# Theming — split on the stage it fails at
{: .no_toc }

1. TOC
{:toc}

---

> **The documentation entry for the `theming` subgraph.** Bean `2krx`: every
> time an instance names a directory as a subgraph it owes a **visualiser** and
> a **documentation entry**. `cat-harness/skills/theming/` arrives owing both, and
> shipping it without them would manufacture the finding rather than clear it.
> This is the entry; `bun run theme:sheet` is the visualiser.

## The axis, and why the ordering matters more than the names

The owner asked for theming skills *"broken up thematically"* on 2026-09-20,
and then chose the axis: **"1 + 2, then specialized to 3"** — three levels, not
a choice between three options.

| | stage | faces | owns |
|---|---|---|---|
| 1 | `theme-art-intake` | **producer** | art arrives; accepted with its declaration written, or refused with a named reason |
| 2 | `theme-declaration` | **producer** | what a theme IS as data — palette, three layouts, `textRegion`, `avatarRegion` |
| 3 | `theme-generation` | **consumer** | `themes.css`, and the fallback that paints over its own art |
| 4 | `theme-contrast` | **consumer** | scrims, WCAG, and why the measurement is over pure black |
| — | `theme-artefacts` | specialisation | sticky, landing board, docs background, navbar avatar — only what DIFFERS |

**Stage is primary because that is how the failures arrive.** Four rounds of
*"still not image"* were one cause, and each round was one stage.

**Artefact-first would duplicate intake and contrast into every surface** —
the shape that put the scrim rule in one skill's prose and let it be
rediscovered rather than read. Stage-first with specialisation last means a new
artefact inherits the stages and declares only its difference. The avatar crop
boxes are the worked example: the *rule* that a crop is declared data belongs
to declaration, and the *boxes themselves* are navbar-avatar specialisation.

**Producer/consumer is not a second partition of the same set.** It says which
direction a stage faces, and it is what makes *"a theme with no CSS rule falls
back to an opaque surface and paints over its own art"* a **consumer** fact
rather than a generation detail: the generator did its job, and the reader of a
missing rule is where it goes wrong.

## One flat directory, not one per stage

`cat-harness/skills/theming/` is a single declared directory whose *files* carry the
split. Five declarations would owe five visualisers and five documentation
entries under `2krx`, which manufactures findings on a repository that is
trying to clear nineteen. *"Broken up thematically"* is satisfied by the files.

`overview.md` is authored **as a skill**, not as a `README.md`, and that is not
a formality: `isSkillMd` is declaration-over-location, so a markdown file here
with no `$schema:` enters the graph as a skill either way — a README would be
one with no `name` to be fetched by, and the one orientation file an agent
could not reach through `skill_fetch`.

## What moved, and what deliberately did not

`theme-art-intake` moved from `skills/folio-core/` and **kept its name**. Ids
are stable across a relocation while paths are not, so `skill_fetch` and
`roles.json` resolve unchanged.

`theme-ui-review` stayed in `folio-core`. It is a UI review skill covering
branding, languages and findings discipline, for which theming is one subject
rather than *the* subject. **A directory that takes every file with `theme` in
the name is a directory nobody can describe.**

## Looking at it — `bun run theme:sheet`

Every theme: palette swatches, the scrim's contrast against the binding case,
and each layout's art with its `textRegion` (blue) and `avatarRegion` (pink)
drawn, plus that clip at 46px navbar size.

**It prints and never gates**, and that is deliberate. The schema proves a
scrim parses and a crop box is square and inside the frame; it cannot see what
a picture shows. Two of the first seven avatar boxes framed scenery, and the
operations box was square, in bounds, and clipped the crown off a hard hat —
caught by the owner looking at a render. A check that cannot answer the
question should not pretend to, and one made fatal on a judgement gets switched
off.

Numbers that *can* be gated are gated elsewhere and not restated: the contrast
ratios are computed in `schemas/themes.test.ts`, so the sheet shows them
against the AAA floor rather than claiming them. Run independently, the sheet
reproduces the recorded 9.25–9.36:1 range, which is the cheapest confirmation
there is that the comments beside those values are still true.

`bun run avatar:crops` is the narrower sibling — the navbar-avatar
specialisation on its own.

## Contrast is measured over PURE BLACK

An instance can declare its own art for a role, so the art a value was tuned
against is **not** the art it will meet. Measuring against today's storm-grey
cloud yields a number true of one picture; measuring against pure black yields
one true of any. The shipped scrims measure **9.25–9.36:1** there, against
roughly 14:1 on pure white — the dark end is binding, by a wide margin — and
the **AAA 7:1 floor** is a floor rather than a target.

The `high-contrast-light` / `high-contrast-dark` pair declares **no backdrop at
all**, deliberately: art behind ink is the thing those two exist to remove, and
a scrim strong enough to make an arbitrary photograph safe at their ratios
would hide the photograph anyway.

## Related

- [Harness instances](harness-instances.html) — the rendering obligation this
  subgraph discharges, and bootstrap's exemption from it
- Beans: `1hvo` (this split), `2krx` (the QA axis), `603s` (`avatarRegion`),
  `ivfw` (the theme surviving a pin), `5y4b` (themed todo stickies)
