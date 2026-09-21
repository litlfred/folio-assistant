---
# folio-assistant-y90d
title: state-visualizer has ankg's defect too, and cannot take ankg's fix — its dashboards carry no self-identifying marker and it publishes at the SITE ROOT
status: completed
type: task
priority: normal
created_at: 2026-09-20T22:49:13Z
updated_at: 2026-09-21T05:59:34Z
parent: folio-assistant-vke6
---


Found while fixing `ankg`, by checking the third generator rather than
assuming it was covered.

## It has the same defect

`cat-harness/scripts/state-visualizer.ts` writes one dashboard per declared
state graph:

```ts
for (const g of graphs) emit(join(SITE, g.id, "index.html"), dashboardPage(g, graphs));
```

`emit()` compares only the files it is about to write — the same structural
blindness `ankg` names. Rename a declared graph's `id`, or remove the
declaration, and its dashboard survives at a URL nothing links to, with
`--check` reporting clean over it.

## But it cannot take `ankg`'s fix, for two reasons

**1. Its pages do not identify themselves.** `ankg`'s fix is safe because a
subject page carries `var SCOPE = "<subject>";`, so ownership is READ off the
file rather than assumed from the directory. `dashboardPage()` emits no
equivalent — grepping a committed dashboard for a `var <NAME> = "…"` marker
returns nothing. Without one, "prunable" would have to mean "in a directory I
expected to own", which is precisely the assumption
`deletion-requires-confirmation` forbids.

**2. It publishes at the SITE ROOT, not under a page directory of its own.**
`gen-schema-viz` and `gen-library-viz` own `<site>/<handler>/<seg>/`, a tree
containing nothing but their subject directories — `viewerPlacement` puts the
data at `<site>/assets/<kind>/`, outside it. `state-visualizer` writes
`<site>/<id>/`, and the site root also holds the docs pages, `assets/`, and
everything just-the-docs emits. Scanning it for "directories that are not
declared state graphs" would classify the whole site as foreign.

`RESERVED_IDS` (currently `{"assets"}`) and the `_`-prefix rule are the
existing nod at this collision, and they are a denylist — the thing that has
to be enumerated and will be incomplete.

## Done when

- [ ] a dashboard declares which graph it is for, in its own bytes, the way a
      viewer page declares its `SCOPE`
- [ ] pruning is scoped to something the generator demonstrably owns, NOT to
      the site root — either a page directory of its own, or an owned-file
      manifest
- [ ] `--check` reports an orphaned dashboard as a finding
- [ ] a planted orphan is pruned and a hand-authored sibling at the site root
      survives, both asserted
- [ ] the `RESERVED_IDS` denylist is re-examined once ownership is readable:
      an allowlist derived from the declaration may replace it

## Not in scope

Changing where dashboards publish. The route is the owner's ruling
(`<base-url>/beans`, `<base-url>/todos/`), settled on `o7eq` after two earlier
attempts, and this bean is about pruning rather than about the URL.

## Not started

Opened while `ankg` was being fixed for the other two generators. `ankg`'s
helper (`orphanSubjectPages` in `gen-schema-viz.ts`) is the shape to reuse
once a marker exists — do not write a fourth.


---

## Summary of Changes — 2026-09-21 (session_014HGPQoUnzXGqSspA8x6YyD)

**The marker came first, because nothing else could.** `page()` now takes a
required `scope` and writes `<meta name="fa-state-graph" content="<id>">` into
every dashboard. Required rather than optional so it cannot be forgotten on
one page — and a page without it is, correctly, not prunable. A `<meta>`
rather than `gen-schema-viz`'s `var SCOPE` line because a dashboard carries no
inline script to put one in: same rule, page-shaped.

**One helper, not a fourth.** `orphanSubjectPages` gained an `OwnerReader`
parameter defaulting to the `var SCOPE` reader, so both viewer generators are
unchanged and `pruneOrphanDashboards` supplies `dashboardOwner`. The bean asked
for the shape to be reused; this is that, with the marker's SYNTAX left to each
generator and only the RULE shared.

**The site root stopped being a hazard.** Ownership is read off the file, so a
directory is a candidate because its `index.html` names ITSELF — never because
of where it sits. A hand-authored neighbour, and a page whose marker names
something else, are both `foreign`: reported nowhere and left.

Two departures from `gen-schema-viz`, both from publishing at the root:

1. **`foreign` is not reported.** There it is an anomaly in a tree of nothing
   but subjects. Here it is the ordinary case — every docs page, `assets/`,
   everything just-the-docs emits — and a line per neighbour every run trains a
   reader to skip the place a real finding appears.
2. **The generator's own FILE goes, not the directory.** A sibling in that
   directory is somebody else's; the directory follows only when nothing else
   was in it. `deletion-requires-confirmation`, applied to the one difference
   that matters here.

## Done when — each verified

- [x] a dashboard declares which graph it is for, in its own bytes — and a test
  asserts every one of the six committed dashboards carries it, so a page
  written without one cannot go unnoticed
- [x] pruning is scoped to something the generator demonstrably owns — the
  marker, not the directory, not the site root
- [x] `--check` reports an orphan as a finding — verified end to end: exit 1
  with a planted orphan, exit 0 without
- [x] a planted orphan is pruned and a hand-authored sibling survives, both
  asserted — plus two cases the bean did not ask for: a marker naming SOMETHING
  ELSE is foreign, and an orphan directory holding a file this generator did not
  write keeps the directory
- [x] `RESERVED_IDS` re-examined. **It stays a denylist**, and the reasoning is
  on the constant: the two questions are different ones. It governs WRITING —
  which route this generator refuses to publish into, where being wrong puts a
  page inside Jekyll's machinery. Pruning no longer consults it at all, so an id
  missing from the list can no longer cause a deletion, which was the
  incompleteness that made a denylist worrying.

Verified: `bun test` 4816 pass / 0 fail (34 in `state-visualizer.test.ts`, 6 of
them new); `bun run gates` 77/77.

**Not in scope, as the bean said:** where dashboards publish. The route is the
owner's ruling on `o7eq` and this was about pruning.
