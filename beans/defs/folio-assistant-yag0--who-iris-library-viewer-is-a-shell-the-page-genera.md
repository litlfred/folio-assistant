---
# folio-assistant-yag0
title: 'WHO-IRIS LIBRARY VIEWER IS A SHELL: the page generates, the link is right, and neither the corpus entry nor the 3 materialized assets appear'
status: todo
type: bug
priority: high
created_at: 2026-09-23T05:46:53Z
updated_at: 2026-09-23T05:51:17Z
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

## What IS wrong

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
