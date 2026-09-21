---
# folio-assistant-68au
title: Every graph tile in the navbar 404s — the href never gets the baseurl
status: completed
type: bug
priority: normal
created_at: 2026-09-21T20:47:15Z
updated_at: 2026-09-21T22:58:51Z
parent: folio-assistant-o3xy
---

Issue #801. `graph-tiles.ts` stores a site-root-relative href (`/beans/`), which is right as data. `docs-ui.js`'s `tileLink` writes it into an anchor with no `site.baseurl`, so under `baseurl: /folio-assistant` every one of the 12 tiles resolves against the ORIGIN and 404s. The owner found it from the other end: looking for the beans board and landing on https://litlfred.github.io/beans/ — which is exactly what the beans tile links to.

docs-ui.js already states the rule it breaks, on the other tile family: an absolute `/kg/` is a 404 rather than a wrong-looking link.

`test/graph-tiles.e2e.ts` did not catch it because it asserts the rendered href EQUALS the declared one — true only because the code does nothing, and the fixture serves at the origin root. Same shape as the `toRootFor` test PR #776 paid for.

## Done when
- [x] Tile hrefs composed against the site baseurl rather than emitted raw
- [x] The baseurl reaches the client explicitly, not inferred from an optional block that can be absent
- [x] graph-tiles.e2e.ts runs under a non-empty baseurl and fails without the fix
- [x] bun run gates green

## Round 2 — the tile's glyph (owner asked, and sent the reference art)

- [x] `VisualisationSchema.icon` — a glyph NAME, never markup: `tileLink` uses `innerHTML` and a declaration is INHERITED, so a markup field would be an injection site reachable from a dependency
- [x] `hasOwnProperty` guard — `constructor` is an inherited property of every object literal; falsified, the bare lookup renders no `<svg>` at all
- [x] An unknown name falls back rather than failing — registry ships with the site, declaration is authored apart from it
- [x] The glyph, drawn for 20px (`.fa-tile svg` is `1.25rem`) rather than for the reference art
- [x] Verified in situ with the real harness.json, CSS and JS — `/folio-assistant/beans/`, own glyph among ten generic

## Summary of Changes

Two commits on `claude/zealous-turing-v49ph5`, PR #803.

`32183b9e` — the 404. `withBase()` in `mountGraphTiles` (not in the shared `tileLink`: the action tiles are already Liquid-composed and would double the base), fed by a new `<meta name="fa-baseurl">`. The e2e fixture gained a non-empty base, because at the origin root "composed" and "not composed" are the same string and the old assertion restated `publishedHref` — it passed BECAUSE the code did nothing.

`f99b1735` — the glyph. Declared by name, default-deny registry, fallback on unknown. TWO beans rather than the reference's four: five candidates were rendered at 20px and only two-outlined kept its shapes and hilums separate there. An icon is not a picture shrunk.

## Closed on evidence

PR #803 merged to `main` as `170bae8d`, 2026-09-21. Closure is on evidence
rather than on authorship, so the evidence is the check rather than the merge
notification: every changed symbol was read back OUT of `origin/main` —
`withBase`, `glyphFor`, `BEANS_GLYPH`, the `fa-baseurl` meta, `TERM_LAYERS`,
`layerArgError`, and the beans entry's `icon: "beans"` — and all eight changed
files are byte-identical between the merged branch and `main`. A squash merge
makes commit ancestry useless for this (`aa4fdcb6` is not an ancestor of
`main`), which is exactly why the content was checked instead.

`main` is green on the merge: Code-quality gates run 2381 on `170bae8d`,
success.

WHAT THIS BEAN DID NOT COVER, deliberately: bean `v18c` — the owner's *"way
too many tiles (non functional)"*. This fixed "non functional"; the other half
(`uploads` and `library` pointing at one page with no tab deep-linking, and
cat-harness's own library empty) is `v18c`'s, still `todo`, with three options
and no decision.
