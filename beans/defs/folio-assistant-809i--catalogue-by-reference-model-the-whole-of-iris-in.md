---
# folio-assistant-809i
title: 'CATALOGUE BY REFERENCE: model the whole of IRIS in the KG without slurping 0.7 TB'
status: todo
type: task
priority: high
created_at: 2026-09-20T08:01:40Z
updated_at: 2026-09-20T08:01:40Z
parent: folio-assistant-kupb
---

Owner: 'in just the docs rendering, mock up the full iris catalog as having been in the KG (by referenced, not slurped up, its .7tb)' and 'stub out their hierachy (collections, etc,) and put this in there. as if this is test import.'

THE POINT IS THE THREE STATES, and this is the same discipline `readme-sections.ts` and `repo-partition.ts` already enforce one level down. A catalogue node is REFERENCED (we know it exists and where, we hold no bytes), MATERIALISED (L1 content is in `library/`), or UNKNOWN. Collapsing referenced into unknown is how a catalogue reports a clean scan over content it never fetched; collapsing referenced into materialised is how `corpus-grep` returns nothing and a reader concludes nobody has done the work.

Three of N are materialised. Everything else is referenced, and the rendering must SHOW the difference rather than letting a reader assume the tree is the corpus.

## Done when
- A `catalogue` graph is declared in `who-iris/harness.json`, with communities and collections stubbed down the measured breadcrumb.
- Every node declares its state; there is no default that means 'materialised'.
- The just-the-docs rendering distinguishes the three visually and says what the distinction means.
