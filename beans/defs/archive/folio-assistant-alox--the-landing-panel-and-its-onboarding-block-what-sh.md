---
# folio-assistant-alox
title: The landing panel and its onboarding block — what shipped, and what is still judgement
status: completed
type: task
priority: normal
created_at: 2026-09-19T07:27:54Z
updated_at: 2026-09-23T17:08:01Z
parent: folio-assistant-o3xy
---


_2026-09-19T07:28:25Z_ — WHY THIS BEAN EXISTS: the owner asked, 2026-09-19, that the landing work be 'implemented as a todo' rather than carried ad-hoc through a chat. This is that record. WHAT SHIPPED, all on branch claude/festive-galileo-s7ibx0 / PR #345, all verified by a local jekyll build rather than by reading the template. (1) THE BACKDROP 404. docs/_includes/landing.html interpolated card.src, mobile.src and backdrop.src raw. The site is a PROJECT Pages site (docs/_config.yml:18, baseurl '/folio-assistant'), and sync-docs-harness.ts deliberately writes a baseurl-AGNOSTIC site-root path into _data/harness.json, so the filter is the template's job and three sites were missing it. title.html:17 had it right all along, which is what proved this a template bug and not a data or generator bug. (2) THE FADE. .folio-landing__art img at opacity 0.9, with 0.8 under :root[data-fa-scheme='light']. TWO VALUES, NOT ONE, and the reason is the part worth keeping: CSS opacity blends toward whatever is BEHIND the image, which is the page background, and _config.yml sets color_scheme: dark, so the default ground is near-black. The overlay ink is a fixed dark green sized against the artwork's CREAM cloud, so fading toward white helps its contrast and fading toward black by the same amount hurts it. Scoped away from .folio-landing--no-region, where the words sit BELOW the picture and a fade is simply a degraded image. NOT VISUALLY VERIFIED by anyone as of this note. (3) THE ONBOARDING BLOCK on docs/index.md, four parts in order: the work plan is beans and here is how to claim one; make your first folio with bun run init-folio; know whether you are writing a document or a paper (content-types.html); and the documentation you will never read (guides/index.html), which is the owner's own phrasing and is kept rather than sanded off — it matches AGENTS.md's self-aware register and it is honestly true of every thorough docs site. All four links are emitted through relative_url, not written relative: they would have WORKED relative, because index.md carries permalink: /, but that is position-safe rather than baseurl-safe and the whole of bean blv9 is about link-shaped values that resolve by luck. Verified: all four targets build, and the emitted hrefs carry the baseurl. WHAT IS STILL JUDGEMENT, and is why this is todo rather than done. (a) NOBODY HAS SEEN THE FADE. 0.9/0.8 were chosen from the blend direction, not from looking; they may be too timid to help the overlay or too strong for the art. (b) THE ONBOARDING BLOCK IS ON docs/index.md, NOT IN THE CLOUD. The landing description lives in cat-harness.json and is drawn inside a declared textRegion that is 53% x 28% of the laptop crop — a few lines. Four links and three code fences do not fit, and overflow is rendered rather than clipped (landing.html says so deliberately), so they would have grown out over the cat. Putting them below the panel was the only placement the geometry allows, and it is worth re-checking with the owner because the request said 'the markdown'. (c) THE BLOCK IS ENGLISH ONLY. index.md declares available_locales ar/zh/fr/ru/es and the repo has a translation workflow; this text is new and untranslated. NOT A DEFECT YET, but it is the kind of thing that silently never gets picked up. RELATED, NOT DUPLICATED: bean blv9 owns the defect CLASS (link-shaped values nothing checks resolve) and now carries seven instances; this bean owns the landing panel as a feature.

## 2026-09-22 — item (a) resolves, and not the way it was posed

**The fade cannot be seen because there is nothing it applies to.**

Item (a) asked whether 0.9/0.8 are right, since they were "chosen from the
blend direction, not from looking". The question is moot: the rules target
`.folio-landing__art img`, and **`folio-landing__art` is emitted nowhere**.

### Measured, over the publish ref rather than the working tree

| | |
|---|---|
| published pages carrying `class="folio-landing` (the MARKUP) | **0** |
| published pages carrying `.folio-landing__art img` (the inlined CSS) | **331** |
| `folio-landing` classes `landing.html` can emit | `folio-landing folio-landing--plain`, and that is all |

`--plain` is the no-stickies fallback and renders `{{ h.description | markdownify }}`
— **no art element at all**. So four rules ship inlined on 331 pages and match
nothing:

    .folio-landing__art { display: block; }
    .folio-landing__art img { ... }
    .folio-landing:not(.folio-landing--no-region) .folio-landing__art img { opacity: 0.9 }
    :root[data-fa-scheme="light"] ... { opacity: 0.8 }

`.folio-landing--no-region` is never emitted either. Only
`.folio-landing { position: relative; margin: 0 0 2rem; }` can ever match.

The art moved to the sticky board — `fa-sticky--backdrop` — whose image
computes `opacity: 1` in BOTH schemes, confirming the pair is not in force.

**This is the `dh4f` shape in CSS**: a declaration nothing reads, and nothing
noticed. Same family as `5yrl`'s image roles, one layer over.

### Two things I nearly reported and did not

**The mobile crop on desktop.** The published `<picture>` has sources for
mobile (≤30rem) and card (≤48rem), and its `<img>` fallback — what every wide
viewport gets — is `landing-mobile.webp` (941x1670, portrait), while
`landing-laptop.webp` (1671x941) exists and is declared. That looks exactly
like a declared-but-unread asset. **It is deliberate**, and `landing.html:229`
says so: *"content decides the default and the viewport still overrides …
the viewport is a hard constraint and the content shape is a preference."*
`chosen = st.art[st.shape]`, and this sticky's content shape is `mobile`.
Recorded because the next reader will find the same thing and reach for the
same wrong conclusion.

**Missing artwork in my screenshots.** The backdrop rendered blank. That was
my harness — `loading="lazy"` on an image never scrolled into view,
`naturalWidth 0`, `complete false` — not the site. Checked before reporting.

### How it was looked at, since "nobody has seen it" was the whole item

The live URL is unreachable from here (the proxy 403s it), so the publish ref
was extracted with `git archive origin/gh-pages` and served over a local
static server to a real Chromium at 1280x900, both schemes, with every
external fetch blocked. That is the `staging-review` route, and it works.

### What remains

- [x] **(a-successor) the dead CSS** — four rules on 331 pages matching
      nothing. Deleting them is provably a no-op for rendering, BUT the block
      carries a long rationale about which way `opacity` blends that is worth
      keeping somewhere. Owner's call: delete, or move the reasoning to the
      sticky backdrop's CSS where a fade would now live.
- [x] (b) the onboarding block's placement — owner: keep it below the panel
- [x] (c) English only — owner: translate now; done in all five declared locales

## DONE 2026-09-22 — the dead CSS is out, and the scope was larger than reported

Owner: *"Do as recommended."* Option 1 — move the reasoning, delete the rules.

### It was eleven selectors, not four

The issue quoted the four fade rules. Checking the whole `<style>` block before
cutting: **14 selectors, of which 11 matched nothing** — every rule reaching
for `folio-landing__art`, `folio-landing__text` or `folio-landing--no-region`.

Verified before deleting, not inferred: those three classes appear in **no
markup** anywhere in this repository, and on **none** of the 331 published
pages that were inlining CSS for them. Their only other appearance is this
bean's own prose.

Three selectors survive, and they are the whole live surface:

    .folio-landing
    .folio-landing--plain
    .folio-landing--plain p

**106 lines net removed.**

### What moved, and the two things that deliberately did NOT

The blend-direction argument is now at `.fa-sticky--backdrop::before` in
`docs-ui.css`, reframed as **why a scrim supersedes image opacity**: `opacity`
blends toward whatever is behind the card, so the old approach needed one value
per scheme; a scrim is a layer of a KNOWN colour, so it needs one value for
both. That is the insight worth keeping and it is not obvious — somebody will
reach for `opacity` there again otherwise.

Not carried over, each for a reason:

- **The region, overflow and breakpoint-parity lessons.** Already re-derived,
  and better stated, on `.fa-landing-sticky--fixed` — which even records that
  it restored geometry *"dropped because overflow used to be silent"*. Copying
  them would be a rule in two places, free to drift.
- **The `cqw` container-query finding** — that an element declaring
  `container-type` is not its own query container. True, and advice about a
  mechanism the successor does not use: it scales through `--fa-text-scale`.

### Verified

`gates` 110/110, `bunx playwright test` **400 passed** — including the
accessibility suite, which renders real pages. The removal is a no-op for
rendering by construction: a selector matching nothing has nothing to stop
matching.

### The silence that allowed it

CSS has no error for a selector that matches nothing. The same silence is
recorded two hundred lines away in `docs-ui.css`, where
`.fa-sticky--backdrop > .fa-sticky-art` matched nothing because the `<img>` is
a grandchild — *"the page built clean, the markup was right, every request
returned 200"*. Twice in one stylesheet, found both times by looking rather
than by a gate.

## Summary of Changes

Closed 2026-09-23. The owner went through this bean's two open items when asked to "go through beans".

- **(b) Placement: kept below the panel.** Owner's choice, recommended. Since #1095 the cat card starts as a tile, so putting the block inside the card is even less workable than the 53% × 28% text region already made it.
- **(c) English only: translated now.** Owner's choice. The "Four things, in order" block is now on `ar/`, `es/`, `fr/`, `ru/` and `zh/` `index.md`, in the same position as the English: after the buttons, before "What is folio-assistant?". Code fences, commands and link targets are unchanged, and every link goes through `relative_url` so the `/<locale>/` pages resolve. Each page keeps `translation_status: unverified`, which is true: these are agent translations that no human has checked.
- **One fix to the English source while in there.** The fence named `scripts/install-beans.sh`. That path has not existed since the split, so it failed for anyone who copied it (bean `b963`'s class of defect). It is now `cat-harness/scripts/install-beans.sh` in all six languages.
