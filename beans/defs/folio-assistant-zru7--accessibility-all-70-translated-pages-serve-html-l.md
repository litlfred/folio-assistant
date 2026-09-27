---
# folio-assistant-zru7
title: 'ACCESSIBILITY: all 70 translated pages serve html lang=en-US; 56 are never corrected even at runtime'
status: todo
type: bug
priority: high
created_at: 2026-09-27T08:24:45Z
updated_at: 2026-09-27T08:24:45Z
parent: folio-assistant-bzyu
---

Found 2026-09-27 while settling `sfjo`'s last item. **Observed in a built site, not
inferred** — which matters, because `sfjo` carries a correction about exactly the
opposite mistake (inferring a consequence from a key's name).

## Measured, by building the site with `bun run preview:site`

    translated pages built                              70
    declaring a `lang` that is NOT their locale         70
    carrying any `dir` attribute at all                  0

Every one reads:

    <html lang="en-US">

including the Arabic pages. The source pages declare `lang: ar`, `lang: zh` and so
on correctly; nothing carries the declaration into the served document.

## Why, in four locally checkable facts

  1. `just-the-docs` 0.12.0 `_layouts/default.html:7` is
     `<html lang="{{ site.lang | default: 'en-US' }}">`. **`site.lang`, not
     `page.lang`** — and no `dir` attribute anywhere in the layout. Verified by
     downloading the pinned gem and reading it; `page.dir` appears nowhere in
     `_layouts` or `_includes`.
  2. The repository has no `docs/_layouts/` at all, so nothing overrides it.
  3. `docs/_config.yml` declares no `lang:` key, so `site.lang` is undefined and
     the `en-US` default wins for every page in the site.
  4. `docs/assets/js/docs-ui.js:9924-9925` sets `dir` **and** `lang` on `<html>`
     — but only **inside the RTL branch**:

         if (RTL_LANGS.indexOf(pageLang) !== -1) {
           document.documentElement.setAttribute("dir", "rtl");
           document.documentElement.setAttribute("lang", pageLang);
         }

## So the damage is not uniform, and the split is the point

  * **`ar`** (14 pages): patched to `lang="ar" dir="rtl"` when `init()` runs. Wrong
    before that and wrong with JavaScript off, but eventually right.
  * **`es`, `fr`, `ru`, `zh`** (56 pages): the branch never fires, so they
    **permanently** declare `lang="en-US"` while serving Spanish, French, Russian
    and Chinese. JavaScript on or off, first paint or steady state.

That is WCAG 3.1.1 (Language of Page) for 56 published pages. A screen reader
applies English pronunciation to Chinese and Russian text, and `lang` is also what
lets a browser pick fonts and hyphenation.

## The accessibility gate does not catch it, and could

`test/a11y.e2e.ts` checks `lang` on ELEMENTS — `.lang[lang="qaa"]`, the locale
switcher — and never reads `document.documentElement.lang`. So the one gate whose
job this is passes over 56 failing pages. A one-line assertion in the i18n spec
would have caught it on the day the first translation landed.

## Not fixed here, deliberately

The fix is a change to how every page in the site is rendered — a local
`_layouts/default.html` override, or a `_config.yml` change, or asking whether the
runtime patch is meant to be the mechanism at all. That is a design decision about
the whole docs site rather than part of the translation pipeline, and
`sfjo`'s scope is front-matter keys. **Reported, not acted on.**

## Done when

- [ ] Decide the mechanism: a local layout override emitting `page.lang` and
  `page.dir`, versus keeping the runtime patch and widening it beyond RTL. Record
  WHY, since the runtime patch cannot fix first paint or a JS-off reader.
- [ ] `<html lang>` equals the page's own locale on all 70 translated pages,
  checked in a BUILT site rather than in source front matter
- [ ] `a11y.e2e.ts` asserts `document.documentElement.lang` matches the page's
  declared locale, so this cannot return silently
- [ ] Settle whether `dir` belongs on `<html>` at build time as well as at
  runtime — `sfjo` established that `dir:` front matter currently reaches nothing
