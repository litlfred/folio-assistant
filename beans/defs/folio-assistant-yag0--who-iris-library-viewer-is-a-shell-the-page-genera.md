---
# folio-assistant-yag0
title: 'WHO-IRIS LIBRARY VIEWER IS A SHELL: the page generates, the link is right, and neither the corpus entry nor the 3 materialized assets appear'
status: in-progress
type: bug
priority: high
created_at: 2026-09-23T05:46:53Z
updated_at: 2026-09-23T06:49:58Z
parent: folio-assistant-yj32
---

Reported by the owner, 2026-09-23, from the deployed site:

> library for who-iris does not work,
> https://litlfred.github.io/folio-assistant/cat-harness/docs-auto/index/docs/who-iris-docs/
>
> i got to there by clickinv library under
> https://litlfred.github.io/folio-assistant/who-iris/ whcih should toak me to
> who-iris library w/ 3 thigns … (at least, all materialized assets)

## What is NOT wrong — ruled out by building, not by reading

The obvious diagnosis is a mis-targeted link, and it is wrong. Built the site
locally and ran the mount step, then read the rail off the rendered page:

| label | href |
|---|---|
| `library` | `../cat-harness/library/who-iris/` — **correct** |
| `docs` | `../cat-harness/docs-auto/index/docs/who-iris-docs/` |

So the **library link is right on `main`**, and the URL reported is what the
*docs* link points at. Two possibilities for how the owner arrived there, and
this bean does not settle which: a stale deployment (the `ha78` visualiser-ref
fix and the `sjic` navbar work both landed 2026-09-22), or the two rail entries
being adjacent and small.

Also ruled out: the tiles data is correct (`kind: library` →
`/cat-harness/library/who-iris/`), the template is correct
(`href="{{ v.path }}"` labelled `{{ v.kind }}`), the page IS published by the
build, and the page's `h1` IS *"Library — the L1 corpus"* — it is the right
viewer, not the uploads one. An early reading of mine said otherwise; it had
extracted a sub-fragment.

## ~~What IS wrong~~ — STRUCK 2026-09-23, THE FINDING WAS FALSE

**The page is a shell.** `cat-harness/docs/cat-harness/library/who-iris/index.html`,
20,160 bytes, committed and built identically, contains **none** of:

| expected | in page |
|---|---|
| `9789241548960` — the one directory under `who-iris/library/`, which `library-graph.ts` reads as a corpus entry | ✗ |
| `WPR-RDO-2020-003-eng` — materialized | ✗ |
| `WHO_PUB_TPS_93.1` — materialized | ✗ |

`gen-library-viz.ts` runs clean and claims the page: *"17 entr(ies), 3
queue(s), 22 uningested, 6 subject page(s)"*, and writes
`library/who-iris/index.html` among them. So the generator believes it
produced a who-iris subject page, and the page it produced holds no who-iris
subject matter. That is the gap.

The three materialized assets are under `who-iris/uploads/` (the rail's own
raw/CDN links on `/who-iris/` resolve to `who-iris/uploads/<slug>/…`), so the
uploads section of this page is where at least those should appear, and it
renders its empty state.

## Where to look first
1. The subject **scope filter** — the generator filters by subject
   (`inScope`, and `G.uploads.filter(...)`). A scope that matches nothing
   produces exactly this page: generated, well-formed, empty, and silent.
2. Whether `library-graph.ts` reads `who-iris/library/` at all. Its rule is
   that every DIRECTORY under a library graph is a corpus entry and only loose
   files are ignored — and who-iris's `library/` is mostly loose `.html`
   (`collection-*.html`, `item-*.html`) around one directory.
3. Whether `who-iris-uploads` declaring the **library** visualiser path
   (`cat-harness/docs/cat-harness/library/who-iris/index.html`) rather than the
   `uploads/<instance>/` path every other instance uses is related. Two kinds
   name one page here, and the tiles data shows both pointing at it.

## Done when
- [ ] the page lists who-iris's corpus entry and its materialized assets, or
      states in the page why there are none — an empty state that cannot tell
      "nothing here" from "the filter matched nothing" is the defect, not the
      symptom
- [ ] a check fails when a declared subject page renders none of its subject's
      entries, so this cannot recur silently
- [ ] confirm whether the deployed site was merely stale, since that changes
      whether anything about the LINK needs doing at all

## FALSE FINDING — corrected 2026-09-23, issue #1009

**The page works.** Loaded in Chromium against a real build:

```
STATUS LINE: who-iris · 3 entries · 84,292 words · 404 sections
json responses: ["200 .../assets/library/index.json"]
console errors:  []
  contains 9789241548960: true    contains wpr-rdo: true    contains who-pub-tps: true
```

### How the error was made, and why it was unfalsifiable as written

I grepped the committed HTML for the entry names. **The viewer is
client-rendered** — `DATA_HREF = "../../../assets/library/index.json"`, fetched
at runtime, filtered by `inScope(x) { return !SCOPE || x.instance === SCOPE }`.
The names are necessarily absent from the static file for a working page and a
broken one alike. That test could not have returned any other answer.

The bean read as well-evidenced — a byte count, a file path, an "identical
committed and built" comparison — which is what made it convincing and what
made it wrong.

### A second error in the same bean

It said who-iris's `library/` held *"the one directory"*. It holds **three**:
`wpr-rdo-2020-003-eng`, `who-pub-tps-931`, `9789241548960-eng` — exactly the
"3 things" the owner expected. I had read a truncated listing.

### What the evidence says instead

| checked | result |
|---|---|
| the `library` rail link on `/who-iris/` | `../cat-harness/library/who-iris/` — correct |
| the viewer page | 3 entries, `200` on its data, no console errors |
| the data file | 3 entries, 4 uploads, 1 queue tagged `who-iris` |
| the deployment | Docs site succeeded on `47629383` at 06:36Z — NOT stale |

So the owner most likely reached the docs-auto page via the **`docs`** rail
entry, which sits beside `library` as a one-letter glyph plus a bare kind word.

### What actually shipped from this bean

1. **A regression test** — `cat-harness/test/library-viewer-scope.e2e.ts`.
   Its first draft **passed against a fixture with who-iris's entries deleted**,
   because it read the subjects it checked from the viewer's own data: no key,
   no iteration, green. It now takes its expectations from the DECLARATIONS on
   disk, which the failure being looked for cannot empty. Falsified both ways
   before being kept.
2. **The uploads/library visualiser share documented** on who-iris's
   declaration — defensible (the library page carries a scoped uploads section)
   but previously silent, which is why the rail shows two entries at one URL.
3. **`rendered-verification`** gains §"A STATIC read of a client-rendered page
   is not verification — in either direction", written from this failure. The
   skill already existed; I did not consult it.

## Done when
- [x] the page is confirmed to list who-iris's entries — it always did
- [x] a check fails when a declared subject's entries do not reach its viewer
- [x] the deployment question settled: current, not stale
- [ ] whether the rail's adjacent one-letter targets need distinguishing — the
      owner's call, and not this bean's to decide
