---
# folio-assistant-809i
title: 'CATALOGUE BY REFERENCE: model the whole of IRIS in the KG without slurping 361.55 GB'
status: completed
type: task
priority: high
created_at: 2026-09-20T08:01:40Z
updated_at: 2026-09-22T19:30:00Z
parent: folio-assistant-kupb
---

Owner: 'in just the docs rendering, mock up the full iris catalog as having been in the KG (by referenced, not slurped up, its 361.55 GB)' and 'stub out their hierachy (collections, etc,) and put this in there. as if this is test import.'

THE POINT IS THE THREE STATES, and this is the same discipline `readme-sections.ts` and `repo-partition.ts` already enforce one level down. A catalogue node is REFERENCED (we know it exists and where, we hold no bytes), MATERIALISED (L1 content is in `library/`), or UNKNOWN. Collapsing referenced into unknown is how a catalogue reports a clean scan over content it never fetched; collapsing referenced into materialised is how `corpus-grep` returns nothing and a reader concludes nobody has done the work.

Three of N are materialised. Everything else is referenced, and the rendering must SHOW the difference rather than letting a reader assume the tree is the corpus.

## Done when
- A `catalogue` graph is declared in `who-iris/harness.json`, with communities and collections stubbed down the measured breadcrumb.
- Every node declares its state; there is no default that means 'materialised'.
- The just-the-docs rendering distinguishes the three visually and says what the distinction means.

## Summary of Changes — closed 2026-09-22 on EVIDENCE, not authorship

This bean read `todo` while its three Done-when clauses were already met. That is
the same "built but still reads open" defect `yg29`'s step 1 named for `z7ev`,
`lzbw` and `huiu` — one level down, and still open after those three were closed.
Closed here by stream 3 of the #956 consolidation (`w0cr`), which did not build
any of it. `bean-coordination` §"Closing a bean whose work has already landed"
governs: **evidence, not authorship.**

Each clause was re-measured on `main` @ `b7f8945`, in a fresh container, by
running the thing rather than by reading a previous session's report.

| clause | measurement |
|---|---|
| *"A `catalogue` graph is declared in `who-iris/harness.json`, with communities and collections stubbed down the measured breadcrumb"* | **met, at a renamed path.** The declaration is `who-iris/who-iris.json`, entry id `who-iris-catalogue`, `graphKinds: ["catalogue"]`. 8 community nodes (matching the 8 top-level communities the IRIS statistics page reports), 2 collection nodes, 3 item nodes — and the collection path is the breadcrumb `kupb` measured off the full item record, *Home → Regional Office for the Western Pacific → Information products*. |
| *"Every node declares its state; there is no default that means 'materialised'"* | **met, structurally.** `MaterializationSchema.state` is `z.enum(["unknown","referenced","materialized"])` — no `.default()`, no `.optional()` — and `CatalogueNodeSchema.materialization` is required, so a node that omits its state does not parse. `materialization.ts` states the rule in its own header: *"There is deliberately **no default**."* `check:catalogue` → exit 0 over 13 nodes. |
| *"The just-the-docs rendering distinguishes the three visually and says what the distinction means"* | **met, and verified on the BUILD rather than on the generator's output.** Three CSS rules in `gen-iris-pages.ts` — `.state.materialized`, `.state.referenced`, **and `.state.unknown`**, so the third state has a visual rather than falling through unstyled. A legend table gives all three with what each means. And the page says it in prose. |

### The rendering was checked on a built site, not on disk

`AGENTS.md` is explicit that a green gate set is not a rendered page, so the site
was built and the pages opened rather than described:

- `bun run preview:site` → built.
- `bun run cat-harness/scripts/mount-instance-docs.ts --site … --built cat-harness`
  → `who-iris/library/` → **`/who-iris/`** (1,378 files), `who-iris/docs/` →
  `/docs/who-iris/`, `who-iris/library/` → `/library/who-iris/`.
- `/who-iris/community-list.html` carries 11 `referenced` and 4 `materialized`
  badges, the legend, and the prose: *"A row is not greyed out when this
  repository does not hold it — it says referenced instead, which is the actual
  state and the whole point of a catalogue modelled by reference. materialized
  means the bytes are here."*
- `unknown` is rendered as a position rather than as an absence: three of the
  eight communities carry *"size upstream unknown — the storage report's second
  page was never read, and a number interpolated from the first would look
  measured"*.

**The badge carries the word as well as the colour.** `j66n`'s constraint — *"a
theme sets the stripe's hue; it never sets its width to zero"*, SC 1.4.1 — was
checked on the rendering, not assumed from the theme.

### One clause is met at a path the bean does not name, and that is said rather than glossed

The bean says `who-iris/harness.json`; the declaration is `who-iris/who-iris.json`.
The file was renamed after this bean was written (the root `AGENTS.md` records the
same rename breaking its own prose three times in three days). Noted here because
a future reader checking this clause against the bean's literal text will not find
the file, and "the path moved" and "the clause is unmet" are different facts.

### What this close does NOT assert

`kupb` does not close with it. `kupb`'s Done-when is *"Every child is closed"*
and it has **12 further open children** after this one. Nothing about the three
states says anything about Pagefind, CDN publication, caching or detangle, which
are what most of those children are.

