---
# folio-assistant-oi1y
title: 'STANDALONE PAGES JEKYLL COPIES THROUGH HAVE NO NAVIGATION: 33 published pages (23 wireframes + 10 bootstrap) carry no rail and no way out'
status: in-progress
type: feature
created_at: 2026-09-24T05:12:16Z
updated_at: 2026-09-24T05:12:16Z
parent: folio-assistant-p5wm
---

Owner, 2026-09-24, after `edx7` shipped: *"do edx7 navbar on mounted pages too"* —
then, when told mounted pages were already done and asked which family:
**"Both"** (`wireframes/` first, then `api/`).

## Measured on the published site, 2026-09-24

```
1301 of 3151 pages have navigation   (excluding STAGING/)
```

| family | no navigation |
|---|---|
| `api/` | **1816** (TypeDoc; its own toolbar, sidebar and search) |
| `wireframes/` | **23** |
| `bootstrap/` | **10** |
| `cat-harness/` | 1 (the `detangle` orphan — the owner's call, not this bean's) |

## THE INSTRUMENT TOOK FIVE TRIES, and that is the finding worth keeping

Each wrong one produced a confident, wrong number:

| instrument | what it got wrong |
|---|---|
| `class="fa-nav"` exact | called **681 railed smart-trust pages unrailed** — they carry the theme's `<nav id="site-nav">`, not the injected rail |
| `fa-nav` substring | called 21 wireframes railed — the string was inside `<code>` in PROSE, because the navbar wireframe *discusses* `.fa-nav-toggle` |
| `<nav class="fa-nav"` element | missed every theme-rendered page; validated against one positive and no negatives |
| counting `href="../"` | counted the STYLESHEET link as an escape route, so 23 stranded pages looked linked |
| the final one | `<nav class="fa-nav"` OR `id="site-nav"`, validated on THREE positives (injected viewer, mounted page, state dashboard) and one negative |

**Validate an instrument on a known positive AND a known negative before
trusting any count it produces.** Four of the five were checked against
neither.

## There are TWO navigations, and conflating them is what caused all of it

- `<nav class="fa-nav" aria-label="folio-assistant">` — injected by
  `injectRail`, on mounted pages (`mount-instance-docs.ts`) and on generated
  viewer pages (`viewer-page.ts`, `edx7`).
- `<nav aria-label="Main" id="site-nav" class="site-nav">` — the Jekyll
  theme's own sidebar, which `docs-ui.css` styles *using* `fa-nav-*` class
  names. That shared vocabulary is exactly why a substring match looked right.

`sjic` is the bean that makes these one component.

## Why these 33 are stranded and their siblings are not

A wireframe directory holds `as-is.html` beside `intent.md`. The `.md` is laid
out by Jekyll and inherits the theme sidebar; the `.html` is copied through
verbatim and inherits nothing. Same subject, same directory, opposite outcome
— and the `.html` has **no navigation and no outward link at all**, not even
back to the wireframe it belongs to. There is no index page above them either.

## The design objection, raised and answered from precedent

Six of the 23 DRAW a sidebar as part of the mockup, so a real rail sits beside
a drawn one. That is the shape of the IRIS-replica case, where chrome on a
replica is the opposite of what a replica is for.

It does not apply here, and the repository already settled it: `navbar/intent.md`
**also** depicts and discusses the navbar, **and wears the theme sidebar**, and
nobody has treated that as wrong. The drawing is content *within* a docs page.
A replica impersonates another site; a wireframe is this site's own
documentation of itself.

## Shape

Hand-editing 23 committed files leaves the 24th wireframe to forget — the
`edx7` argument exactly. These are not generated, so `edx7`'s `emit` fixture
cannot reach them. The mechanism this repository already has for *"a page
Jekyll never laid out"* is post-build injection, which is what
`mount-instance-docs.ts` does for mounts.

## Done when

- [ ] every standalone page the site publishes carries navigation, by one pass rather than by 33 edits
- [ ] `api/` decided separately — it has its own navigation, so it is a layout question and not a gap (the owner's second stream)
- [ ] verified on the BUILT site, with an instrument validated on positives and negatives
- [ ] the five-instrument lesson written where the next agent measuring coverage will find it
