---
# folio-assistant-5r57
title: 'THE MARK: cat-mark.svg is a solid silhouette where the supplied art is line art, in one scheme and one colour'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T17:11:38Z
updated_at: 2026-09-21T20:50:46Z
parent: folio-assistant-o3xy
---

Issue https://github.com/litlfred/folio-assistant/issues/756 item 7. Owner: 'the icon to left of text folio-assistant is wrong ... make light, dark sage themeed versions. also need browswer tab icon to match. add to avatar/theme skills.'



## Summary of Changes

The supplied art TRACED rather than approximated. potrace over the owner's
image, cropped square about its own bounding box with 12% air, at 384px with
turdsize 6 / alphamax 1.0 / opttolerance 0.6 — chosen from a sweep by measured
IoU against the source bitmap, not by eye: **0.981** at 2.2 KB of path.

`fill-rule="evenodd"` is load-bearing: the ears, the bowl and the counter of
the @ are HOLES in one path, and the default nonzero fills them, turning line
art into a blob.

### The pair is a measurement, not taste

The art's own ink #596a5b is 5.77:1 on white and 5.35:1 on the light sidebar,
but only **2.60:1 on the dark sidebar #27262b** — under the 3:1 bar for
meaningful non-text content. #9db89f is the same hue lifted: 7.00:1 there,
8.82:1 on near-black. Both files come from ONE trace and differ in a single
fill attribute, so they cannot drift.

### Surfaces follow different schemes, on purpose

- sidebar mark → the PAGE's data-fa-scheme (both <img>s emitted, CSS picks;
  Liquid cannot read a client-side attribute)
- tab icon → the OS, via media=(prefers-color-scheme). A <link rel=icon> is
  resolved outside page styling and cannot read the DOM — and the tab strip is
  browser chrome, so matching the OS matches what it actually sits on.

A reader who sets the page against their system sees the two disagree, and
that is correct: each matches its own background.

### Three things that cost a cycle each, now in the skill

- potracer treats ZERO as foreground, the inverse of what the name suggests —
  passing the ink mask traces the BACKGROUND (first symptom: a 9-point subpath
  covering 90% of the canvas, IoU 0.01)
- Image.crop past the edge pads with BLACK, which the tracer reads as ink
- measure the result; 'it looks right' over a 2 KB path is not a fact

Also checked rather than assumed: the small variant's original reason is GONE.
It existed because the old mark's whiskers were stroke-width 2.4 on a 120
viewBox (0.32px at tab size). This art is fill-only and its holes survive the
reduction — ink fraction 0.36, flat from 16 to 32px.

Recorded in skills/theming/theme-artefacts.md, with the ratio table, the
'not a CSS filter' rule and the per-surface scheme table.

Verified: gates 94 pass, full playwright 350 pass.
