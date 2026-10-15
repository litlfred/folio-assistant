---
name: ig-site-theme
description: >
  How an IG rendered through just-the-docs wears the theme its instance
  ALREADY declares: the one `webpage` theme becomes the IG site's colour
  scheme. Says which of the three theme paths applies to which surface, what
  is refused, and how to verify on the built CSS rather than on a log line.
  Read before theming an IG site, adding a theme to an IG instance, or
  concluding that a staged IG is unthemed.
---

# ig-site-theme

> Skill id: `ig-site-theme` · Package: `fhir-ig-base` · Instance:
> `fhir-harness` · Beans `k6tw`, `u3cd`, `bamf`, `7h3u`

An IG staged as its own just-the-docs site (`/<instance>/ig/`, bean `bamf`)
wears the palette of the **one `webpage` theme its instance declares**. Nothing
new is authored for the IG: the theme already exists as data, and this is how
it reaches the site.

## The path, end to end

1. **Declared** — the instance's `themes/themes.ts` exports `INSTANCE_THEMES`,
   one of which has `kind: "webpage"` and a `palette` of four roles
   (`surface`, `ink`, `edge`, `accent`). Declaring a theme is
   [`theme-declaration`](../../../cat-harness/skills/ui/theming/theme-declaration.md)'s
   subject, not this skill's.
2. **Resolved** — `stage-ig-sites.ts` `webpagePalette(repoRoot, instance)`
   reads it through `instanceThemes` (`cat-harness/schemas/theme-by-ref.ts`),
   keyed on the instance's **declared name**.
3. **Rendered** — `build-ig-site.ts` `colourScheme(palette)` writes
   `_sass/color_schemes/ig.scss` and sets `color_scheme: ig`. just-the-docs'
   own colour-scheme mechanism does the rest, so the IG keeps the theme's
   machinery unchanged and only its colours move. The sidebar takes `accent`;
   its text colour is chosen by contrast, and a pairing under WCAG AA is
   reported (`CONTRAST:` in the stage log), never hidden.

## What is refused, and what is said

| case | outcome |
|---|---|
| no theme declared | built on just-the-docs' default light scheme, and the stage log **says** `colour scheme: NONE` |
| themes declared, none `webpage` | same, with the reason (`declares themes, none of kind webpage`) |
| **two or more** `webpage` themes | **refused** — nothing says which one dresses the IG |
| a palette pairing below AA | built, and reported under `CONTRAST:` |

## Three theme paths — do not conflate them

| path | surface | data | code |
|---|---|---|---|
| **IG site palette** (this skill, `u3cd`) | the standalone IG site, `/<instance>/ig/` | the `webpage` theme's palette | `stage-ig-sites.ts` → `build-ig-site.ts` `colourScheme` |
| **docs-page theme** (`7h3u`) | the instance's composed docs pages, `/<instance>/…` | the same theme, as CSS variables | `gen-themes-css.ts` → `_data/instance-themes.json` → `head_custom.html` |
| **IG chrome** (`ajx9`) | "fixture" pages that mirror the Publisher's template | the template chain's tokens and rules (`chrome.json`) | `ig-chrome.ts`, `ingest-ig-chrome.ts` |

The first two read **one** declaration, so an IG's site and its docs pages
cannot disagree on colour. The chrome is a different model — the Publisher
template's own CSS, ingested with its conflicts — and is not a palette.

## Verify on the built CSS, not on a log line

A staged site's theme is checked by finding the palette's hex values in the
built stylesheet, e.g. for smart-trust's `who-smart-ig` (`accent #00477d`):

```sh
git show <gh-pages>:STAGING/<slug>/smart-trust/ig/assets/css/just-the-docs-default.css \
  | grep -c '#00477d'
```

**Measured 2026-10-01:** 15 occurrences of `#00477d` and 8 of `#f6f7f9` on
smart-trust's staged IG site.

**The trap this section exists for.** Calling `stageIgSite` directly with no
`palette` option prints `colour scheme: NONE` — truthfully, for that call. Read
as a fact about the instance, it says the theme is missing when it is not. An
agent did exactly that on 2026-10-01 and opened `k6tw` on the false premise.
Stage through `stage-ig-sites.ts` (or pass `webpagePalette(...).palette`), and
judge the result by the built CSS.

## Do not

- Author a second palette for the IG. One declaration, read by both paths
  above; a copy would be a second answer free to drift.
- Touch the theme's machinery. just-the-docs' layout, nav and components stay
  as they are; only the colour scheme is the instance's.
- Put the WHO logo on it. Colour carries identity; the wordmark is set in type
  (owner, 2026-10-01: "no branding" means no logos — bean `jut3`).
