---
# folio-assistant-y90d
title: state-visualizer has ankg's defect too, and cannot take ankg's fix — its dashboards carry no self-identifying marker and it publishes at the SITE ROOT
status: todo
type: task
priority: normal
created_at: 2026-09-20T22:49:13Z
updated_at: 2026-09-20T22:49:31Z
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
