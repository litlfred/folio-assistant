---
layout: default
title: 'Contrast: measured over the darkest thing that could be there'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/theming/theme-contrast.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/theming/theme-contrast.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/theming/theme-contrast.md){: .fa-edit-source }

{% raw %}
# Contrast: measured over the darkest thing that could be there

**Consumer stage.** `generation` emits the ink; this says what the ink has to
clear, and against what.

## The measurement is over PURE BLACK, and that is the whole idea

> Ink over this scrim laid on **pure black** — the darkest art any instance
> could declare, and the binding case.

Arbitrary art sits behind that text. An instance can declare its own art for a
role, so the art a value was tuned against is **not** the art it will meet.
Measuring against today's storm-grey cloud produces a number that is true of
one picture; measuring against pure black produces one that is true of any.

The shipped scrims measure **9.25:1 to 9.36:1** over pure black, against
roughly 14:1 on pure white — the dark end is the binding one, by a wide margin.
**The floor is AAA, 7:1**, and it is a floor rather than a target: a value
below it is not a slightly worse theme, it is a theme that fails.

**Every value here was re-measured rather than nudged.** When a scrim changed,
the ratio was recomputed and written down beside it. A scrim whose ratio nobody
recomputed is a scrim doing less work than it appears to — which had already
happened once.

## Why a comment carries the number

A contrast ratio asserted in prose is a **claim**. The numbers live beside the
values in `schemas/themes.ts` because the alternative is a reader trusting a
sentence, and `themes.test.ts` **computes** them rather than restating them:

> Parsing proves a theme is well-formed. It does not prove the palette is
> legible, so the contrast ratios are computed here rather than asserted in a
> comment — a high-contrast theme whose contrast nobody measured is a claim.

## The high-contrast pair declares NO backdrop, deliberately

`high-contrast-light` and `high-contrast-dark` carry no art, and that is not an
omission to be filled in later. **Art behind ink is the thing those two exist
to remove.** A scrim strong enough to make an arbitrary photograph safe at
their ratios would hide the photograph anyway, so the choice is between a theme
that fails its own promise and a picture nobody can see.

They also carry no gradient: a gradated surface has a *range* of contrast
against its ink, and the weakest point is the real one.

## Colour is never the only channel

The priority stripe is a **width** as well as a colour. Colour alone carrying a
signal fails WCAG SC 1.4.1 and a monochrome reader cannot see it at all, so
`ThemeSchema` has no field with which a theme could set the width to zero. A
theme is a palette and a geometry, not a licence to remove a non-colour
channel.

## A new surface inherits this, it does not renegotiate it

A todo sticky gaining backdrop art (bean `5y4b`) inherits the requirement
exactly: **it must not reach the board by skipping the measurement the landing
stickies pay.** A surface that renders art behind text and has no measured
scrim is a contrast finding whatever it looks like on the reviewer's monitor.

## Related

- [`theme-declaration`](theme-declaration.md) — where a scrim is declared
- [`theme-generation`](theme-generation.md) — why a theme can render with no rule at all
- [`theme-artefacts`](theme-artefacts.md) — the surfaces this applies to, and where they differ
{% endraw %}
