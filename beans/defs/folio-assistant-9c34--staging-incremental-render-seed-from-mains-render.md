---
# folio-assistant-9c34
title: 'STAGING: incremental render — seed from main''s render as cache, re-render only changed assets and their downstream indexes'
status: completed
type: task
priority: normal
created_at: 2026-09-20T21:11:39Z
updated_at: 2026-09-21T05:42:19Z
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


---

## Summary of Changes — 2026-09-21 (session_014HGPQoUnzXGqSspA8x6YyD)

**Built.** `cat-harness/scripts/render-selection.ts` is the selection core:
`hashInputs` (content + path, codepoint-sorted, never mtime), `selectSteps`
(two-pass fixed-point cascade over `needs`), `buildManifest` / `readManifest`
(any read failure → `undefined` → full render). `render-pipeline.ts` gained
`inputs`, `inputGraphs`, `alwaysRun`, `--seed`, `--write-manifest`, a `=` mark
for a cached step and a corrected run count. The skill is
`cat-harness/skills/folio-core/incremental-render.md`. 30 tests in
`cat-harness/scripts/tests/render-selection.test.ts`.

**A step declares graph KINDS, not paths.** `check:declared-paths` rejected the
first draft's nine literals and was right — a second answer to *where do the
skills live* goes stale on the next move, and the render then hashes a path
that is not there and reports the step unchanged. `inputGraphs` names a kind
from `harness.json`; `cat-harness/scripts/declared-dirs.ts` resolves it.

**It is a subprocess because the boundary is real.** `readDeclaration`
validates *every* kind in the declaration, and this repository declares a
`folio` directory whose kind is core's — so the harness layer cannot resolve
any kind in-process without importing core, which `check:partition` rejects.
The first fix degraded honestly but was **inert** (0 cached, no reason given);
the second spawns `declared-dirs.ts` and reports `resolveFailure` in the build
output, so a degraded full render is never silent.

## Done when — against the measurements

- [x] a staging build that changes nothing renders nothing and says so —
  0.9 s, `2 ran, 0 failed, 0 skipped, 8 served from the seed`
- [x] the edges are **declared**, not inferred from timestamps — projection and
  index are both expressible, and `needs` carries the downstream half
- [x] a stale seed is DETECTED rather than trusted — a step absent from the
  manifest re-renders; an unparseable or wrongly-tagged manifest is treated as
  absent rather than partially believed
- [x] could-not-determine ⇒ **full re-render**, never a partial one presented
  as complete — four step-level states and three build-level ones, including
  graph kinds that could not be resolved
- [x] measured, on this repository, 2026-09-21:

  | build | wall | steps |
  |---|---|---|
  | full, writing a seed | 3.9 s | 10 ran |
  | seeded, nothing changed | 0.9 s | 2 ran, 8 served |
  | seeded, one bean touched | 1.1 s | 4 ran, 6 served |
  | seeded, one skill file touched | 3.8 s | 10 ran, 0 served |

  The last row is the **cost of declaring a graph rather than a file list**,
  measured rather than asserted: a skill edit moves the `cat-harness` graph,
  `kg-current` reads that graph, and everything needs its way back to it. Over-
  declaring costs needless runs; under-declaring ships stale pages that look
  fresh. The safe direction was taken deliberately and is written on the skill.

**Not built, and deliberately:** seeding from the *published* render. The
manifest and the selection are here; copying a previous build's OUTPUT into
place before the run is a deployment step and belongs with
`feature-staging.yml`.

Verified: `bun test` 4698 pass / 0 fail; `bun run gates` 77/77 with a
`python3` stubbed to lack pymupdf, so the gate job's environment is what was
tested rather than this container's.
