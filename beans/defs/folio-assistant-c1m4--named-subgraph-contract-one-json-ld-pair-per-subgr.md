---
# folio-assistant-c1m4
title: 'NAMED SUBGRAPH CONTRACT: one JSON-LD pair per subgraph (index = pointers, hydrated = inline), directory IRIs, build-time framing, central @context; harness as a subgraph'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-03T08:10:40Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02: "check the materialization on remote KGs and their subgraphs. in particular is it easy to pull in all the nodes of a named subgraph (e.g. all of folio-assistant/cat-harness/skills/sdlc)? I think skills/ and skills/sdlc are content (sub)graph nodes. their json(ld) should have all the nodes within dir/subgraph. this should be consistent behavior/expectation. update skills/schemas/tools/etc as needed." Plus the referenced/hydrated and IRI points in the parent epic.

Proposed contract (to be confirmed in the PR, then written into the KG skills and schemas):
- Subgraph IRI = a directory IRI in its own namespace, separate from content-node IRIs: `<BASE_URL>/subgraph/<HARNESS>/<NAME>/` (owner floated `/hydrated-graph/…`; pick one)
- Two physical files, both with root `@id` = the directory IRI:
  - `index.jsonld` — referenced: every member node as a URI pointer plus type/label (the skeleton)
  - `hydrated.jsonld` — dereferenced: every member node inline, fully hydrated; KG metadata only, no heavy blobs (blobs stay as asset pointers)
- Both are produced in ONE build step from the same source graph by JSON-LD Framing (a pointer frame and an embed frame) — never by keeping two hand-synced properties (no `authorUri` beside `author`), so they cannot drift
- `@context` is never inlined: every file declares `"@context": "<BASE_URL>/context.jsonld"` (one cached context)
- Recursive: `skills/` contains `skills/sdlc/`; a parent subgraph's files reference child subgraph IRIs, and "all nodes of skills/sdlc" is one fetch
- A harness instance IS a named subgraph of the repo KG with its own membership rule — evaluate a common base type for Harness and (Sub)Graph in `schemas/`

Assessment of the pasted design note (owner asked "does the discussion apply"): yes, largely — framing-at-build removes dual-key desync, a central context keeps files small, directory IRIs decouple subgraph identity from file names. Caveats to settle: GitHub Pages serves `index.jsonld` only by explicit path (no content negotiation), so the directory IRI must be documented as resolving to `index.jsonld`; framing needs a JSON-LD processor in the build (jsonld.js); membership rules must be declared per subgraph, not inferred.

## Done when
- [x] measured today: can `kg:materialize` (fnx4) / the existing JSON-LD export pull every node of `cat-harness/skills/sdlc` in one step? record the answer with evidence
- [ ] contract written into the KG data-modelling skill and `schemas/` (subgraph manifest type; Harness/Subgraph common base decided)
- [ ] generator emits `index.jsonld` + `hydrated.jsonld` per declared subgraph via framing, with a check gate
- [ ] remote materialization consumes the same files

_2026-10-03T08:07:54Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).



## Owner ruling 2026-10-03 — subgraph IRI namespace
Selected: `<BASE_URL>/subgraph/<HARNESS>/<NAME>/` — one IRI names the subgraph; `index.jsonld` (referenced) and `hydrated.jsonld` (dereferenced) are two files under it. `/hydrated-graph/` rejected because the pointer-only index would live under a 'hydrated' path.

## Measured 2026-10-03 — answer: NO, not in one step
- `kg:materialize` (`folio-assistant-core/scripts/kg-materialize.ts`) copies a *subscription's files* by sparse checkout of a declared directory, not graph nodes; it needs a recorded subscription + snapshot. In a fresh container it also fails until `bootstrap`/`bootstrap-tools` submodules are checked out (`Cannot find module '../../bootstrap-tools/schemas/declaration.ts'`).
- `kg:export` (`kg-export.ts:2995`) writes ONE document `_kg/<stub>.jsonld`, every node inline in `@graph` — the monolith f233 forbids. `@context` is inlined (`:2806`, `buildContext()`); content/library docs already use a shared URL (`jsonld.ts:126,148`, `ns/content/v1.jsonld`).
- Membership is inferred by longest-prefix path match in `stampSubgraph` (`kg-export.ts:1369-1445`) against declared directories; `cat-harness.json` declares only `skills/`, so sdlc nodes are stamped `#directory/skills`. `skills/sdlc` is NOT a declared subgraph.
- IRIs: `makeIri(doc, kind, id)` = `<doc>#<kind>/<id>` (`:780`) — directories are fragments of the export document, not dereferenceable.
- Framing: `jsonld` 8 is a dependency (`package.json:491`) but `jsonld.frame` / `@embed` are used nowhere.
- Schema: `GraphNodeDirectoryShape` (`cat-harness.ts:925`) is already the shared base of `ContentDirectoryShape` and `BeanGraphNodeSchema`; there is no `Subgraph` schema.

## Owner ruling 2026-10-03 — hydration depth
Selected "Deep, but not at root": `hydrated.jsonld` inlines EVERY node in the subgraph's transitive membership (so all of `skills/sdlc` is one fetch); the ROOT subgraph (a harness instance, and the repo KG above it) publishes `index.jsonld` only — no root `hydrated.jsonld`, so no monolith. Every level, root included, has `index.jsonld`, which lists direct members as pointers and child subgraphs by IRI.
