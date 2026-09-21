---
# folio-assistant-9c34
title: 'STAGING: incremental render — seed from main''s render as cache, re-render only changed assets and their downstream indexes'
status: todo
type: task
priority: normal
created_at: 2026-09-20T21:11:39Z
updated_at: 2026-09-20T21:12:03Z
parent: folio-assistant-1xhc
---


Owner, 2026-09-20 (session_014HGPQoUnzXGqSspA8x6YyD):

> new skill for staging rendernig.... dont rerender the whole thing... if main
> render is not stale, copy that to staging render pipleine as cahche. trigger
> rerender only on assets that have changed and downstream depndent index.

## The shape

Three steps, and the third is the one that is easy to get wrong.

1. **Seed from main** — if main's render is not stale, the staging build starts
   from a COPY of it rather than from nothing.
2. **Re-render what changed** — the assets this branch touched, and only those.
3. **Re-render what depends on them** — the downstream indexes. A changed
   block changes its chapter's index, its glossary entry, the defined-terms
   page, the community list that counts it. **An index is derived from a SET,
   so it goes stale when a member changes even though the index file itself
   did not.**

## Why step 3 is the whole bean

Step 1 and 2 are a cache and a diff. Step 3 is a dependency graph, and getting
it wrong fails in the direction nobody notices: a page that was not re-rendered
looks exactly like a page that was. That is the `xom7` shape — *a red workflow
looks exactly like a green one from in here* — moved into the render.

Worked example already in the tree: `who-iris/scripts/gen-iris-pages.ts` writes
eight pages from thirteen catalogue nodes. Adding ONE cover thumbnail to one
node changed `index.html` (the submission's cover), that item's own page, and
nothing else — while adding a requirement to `who-iris/skills/iris-dspace.md`
changed `ingestion-notes.html` alone, because that page is a PROJECTION of the
skill. Two different dependency edges, neither visible from the file mtimes.

## Done when

- [ ] a staging build that changes nothing renders nothing and says so
- [ ] the dependency edges are **declared**, not inferred from timestamps —
      a projection (page ← skill) and an index (page ← node set) are different
      edges and both have to be expressible
- [ ] a stale-main seed is DETECTED rather than trusted; seeding from a stale
      render is the failure this bean trades correctness for speed against
- [ ] the skill says what to do when the graph cannot be determined: **full
      re-render**, never a partial one presented as complete
- [ ] measured: wall-clock and pages-written, before and after, on a real branch

## Not started

Queued. Relatives: `lx2s` (feature-branch staging under gh-pages, resolved),
`35kc` (staging parity), `oisv` (a build that produces nothing).
