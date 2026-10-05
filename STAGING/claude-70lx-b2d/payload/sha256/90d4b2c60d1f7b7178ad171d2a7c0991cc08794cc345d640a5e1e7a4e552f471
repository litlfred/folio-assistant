---
# folio-assistant-zru7
title: 'ACCESSIBILITY: all 70 translated pages serve html lang=en-US; 56 are never corrected even at runtime'
status: in-progress
type: bug
priority: high
created_at: 2026-09-27T08:24:45Z
updated_at: 2026-09-27T10:48:41Z
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

- [x] Decide the mechanism: a local layout override emitting `page.lang` and
  `page.dir`, versus keeping the runtime patch and widening it beyond RTL. Record
  WHY, since the runtime patch cannot fix first paint or a JS-off reader.
- [x] `<html lang>` equals the page's own locale on all 70 translated pages,
  checked in a BUILT site rather than in source front matter
- [ ] `a11y.e2e.ts` asserts `document.documentElement.lang` matches the page's
  declared locale, so this cannot return silently
- [x] Settle whether `dir` belongs on `<html>` at build time as well as at
  runtime — `sfjo` established that `dir:` front matter currently reaches nothing

_2026-09-27T10:30:26Z_ — Claimed by claude/wonderful-gauss-7frcrw — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Fixed 2026-09-27 — a post-build pass, `cat-harness/scripts/set-html-lang.ts`

### Item 1, the mechanism: decided by this repository's own precedent, not by preference

**A pass over the emitted tree, not a layout override.** `strip-preview-seo.ts`
already answers this class of question in as many words: the tag lives in the
REMOTE theme, so *"suppressing it at the source would mean vendoring that file —
which is the upstream-coupling hazard each folio's Jekyll config pins the theme to
avoid. A pass over the emitted tree couples to nothing."* `_config.yml` says the
same from the other side at length — the pin exists because an upstream rename
*"degrades a shipped feature silently rather than loudly"*, and moving it is a
documented process with a person in it. A forked `_layouts/default.html` would be
a hundred lines of somebody else's file going stale the next time that pin moves,
for the sake of two attributes.

**Widening the runtime patch is rejected on this bean's own grounds**: JavaScript
cannot fix first paint and cannot fix a reader who has it off. The language has to
be in the served bytes.

**It couples to nothing at all**, which is better than the precedent manages: it
reads each page's own `fa-translation-meta` block — the one `docs-ui.js` already
reads — so it needs no index, no URL-to-file mapping and no knowledge of the
theme. A page states its language; this makes the document say so.

### The primary-subtag rule, which a measurement forced

My first version compared whole values and wanted to rewrite **1317 of 1408**
pages, because the theme emits `en-US` while every page — source pages included —
declares `lang: en`. Those are the same language and `en-US` is the MORE specific
of them, so that would have discarded a region for no reader's benefit on 1247
pages with nothing to do with this bean. Comparing the primary subtag gives
exactly **70**.

Found by running the pass over a real built site, not by reasoning. Pinned as four
tests, including the case where the language already agrees but `dir` is still
owed — the half-corrected state the runtime patch leaves on first paint.

### Item 2, measured in a BUILT site as the item requires

| | before | after |
|---|---|---|
| non-English translated pages | 70 | 70 |
| `<html lang>` equals the page's own locale | **0** | **70** |
| Arabic pages carrying `dir="rtl"` | **0** | **14 / 14** |
| English pages altered | — | **0** (they keep `en-US`) |
| pages where ANYTHING outside the `<html>` tag changed | — | **0** of 1408 |

That last row is the falsifier. The pass rewrites every page of a site before
deploy, so "the Arabic page says `ar` now" is worth little beside a silent change
elsewhere. Twenty-six tests, and the load-bearing one asserts that every other
attribute on the tag survives WITH ITS ORDER — the theme may add its own, and a
rewrite that reprinted the tag would drop them with nothing said.

### Item 3 CANNOT be done as written, and here is why

The item asks `a11y.e2e.ts` to assert `document.documentElement.lang`. That file
serves `/_kg/folio-assistant-i18n-fixture/index.html` — a generated kg-viewer
page, not Jekyll output. So an assertion there would pass over a different page
KIND and look like coverage of the docs pages without being it, which is the
failure shape this repository keeps naming.

What guards it instead: `set-html-lang.ts --check` over the real `_site` in CI —
which is a built site, the thing item 2 insists on — plus 26 unit tests in a
checkout. The script is declared `ci-only` in `gates.ts` for the reason
`strip-preview-seo.ts` and `publish-verify.ts` are: there is no `_site` in a
checkout. **Left unticked** rather than ticked with a substitute.

### Item 4: `dir` at build time, settled

Yes, and it is in. `sfjo` established that `dir:` front matter reaches nothing —
the pinned theme has no `dir` attribute in any layout or include, and `page.dir`
appears nowhere in it. So the runtime patch was the only mechanism; now the served
HTML carries it for all 14 Arabic pages and the runtime patch is a no-op rather
than the load-bearing path.

### Wiring, and one declaration I got wrong

Wired after the Jekyll build in BOTH `docs-site.yml` (the published site) and
`feature-staging.yml` (previews), beside the SEO strip.

Declared in `gates.ts` as `ci-only`, `@covers tools` in the docblock, and
`audit-coverage` regenerated — "0 have NOT said". I also added an
`artefact-verification.json` entry, and `check:artefact-verification` **correctly
refused it**: that file is for generators of COMMITTED artefacts, and this
rewrites `_site`, which is not committed. `strip-preview-seo.ts` appears in
neither of its lists, which confirms it. Removed.

`check:partition` also refused the new module until it was classified — beside
`strip-preview-seo.ts` as harness machinery for the site build, which is the same
reasoning one file over.

161 gates 0 failures; bun test 12297 pass 0 fail; tsc clean; eslint 0 errors.
