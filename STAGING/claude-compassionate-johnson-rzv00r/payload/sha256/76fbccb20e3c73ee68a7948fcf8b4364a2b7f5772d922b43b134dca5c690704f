---
# folio-assistant-g8jp
title: 'who-iris cutover: litlfred/who-iris becomes the (temporary) authoritative source; folio-assistant reads it by remote subscription'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-06T19:12:02Z
updated_at: 2026-10-06T21:59:21Z
parent: folio-assistant-7x5n
---

Owner rulings 2026-10-06: 'go ahead and move who-iris/ repo over to litlfred/who-iris where it is (temporary) authoritative source. but i still want to see remote subscription under litlfred/folio-assistant'; 'i dont want git submodules!'; 'fix gaps and go' (code deps: option 1 — the who-iris repo pins the monorepo as a package, github:litlfred/folio-assistant#<sha>, switching to litlfred/cat-harness + folio-assistant-core once seeded). This is the owner's authorisation that clears 'seeding held' (cat-harness.json knownSubstrates row) for who-iris, and the S8 per-instance OK (bean w0at) for moving its in-tree copy to fsh-guts.

## Plan
- [x] #2307 merges first (it regenerates ~409 who-iris JSON-LD files; seed:ready reported could-not-determine because of it).
- [ ] seed:ready --layer who-iris --rehearse (standalone green beside its needs).
- [ ] Seed litlfred/who-iris (empty repo): minimal initial commit on main, then seed via git subtree split --prefix=who-iris on a branch + PR; fix livesAt; 7 direct climbs into cat-harness/core (platform.ts, themes, two tests) -> the pinned package; CI there for iris:pages:check, iris:covers:check, dc:render:check, check:catalogue, id-lookup:check, tests.
- [x] GAP 1: the docs-site build mounts an instance's docs/site from a SUBSCRIPTION's materialised tree (mount-instance-docs, compose-docs, docs-site.yml) — today only from the in-tree instance.
- [x] GAP 2: harness tiles / navbar from kg:instantiate (who-iris.config.json replaced).
- [ ] folio-assistant: kg:subscribe litlfred/who-iris@<seed sha> (first committed subscription), kg:materialize docs/site/library as needed; repoint/remove the 5 CI gates, 2 path filters, ~17 checkout tests, folio-assistant.json instance list, knownSubstrates, state-on-main-baseline row, NOT_YET_SHIMMED entry.
- [ ] Move in-tree who-iris/ to fsh-guts with a node recording repo + pinned SHA; regenerate.

## Done when
litlfred/who-iris builds and checks green on its own; folio-assistant has no who-iris/ directory, reads it through a committed subscription, and its site still serves /docs/who-iris/.


**Owner 2026-10-06: who-iris depends on folio-assistant-core** (its declared `needs`), never on cat-harness directly. So the 7 direct climbs into cat-harness (platform.ts re-exports of cat-harness schemas/scripts, themes/themes.ts + themes.test.ts, scripts/tests/catalogue-links.test.ts, gen-iris-pages.test.ts) are re-routed through folio-assistant-core's own surface (core re-exports what a downstream content instance may use; cat-harness reached transitively), and the pinned package the who-iris repo depends on is folio-assistant-core — the monorepo at a SHA until litlfred/folio-assistant-core is seeded. A check that who-iris imports nothing outside who-iris/ and core's surface is part of this bean.


**Owner 2026-10-06, supersedes 'pinned package': who-iris REMOTE MOUNTS its dependency KGs** — folio-assistant-core and core's whole dependency closure (cat-harness, bootstrap, bootstrap-tools, …), resolved transitively from each harness's own declaration. Mechanism: bean 0mpw (a declared directory with a remote source pinned to a SHA; the harness's declaration carries the mount defaults; a downstream folio may override by id). So 0mpw's mount command + overlay resolution is a PREREQUISITE of the who-iris seed standing alone, and becomes the first live use of 0mpw. Imports into core's surface resolve through the mounted paths.


**2026-10-06 — pre-cutover landed.** #2307 merged as d7ba198. #2324 merged as c77fafe (session_01QSP1eMedL24aMupML9tka5):
- Import routing: who-iris reaches only folio-assistant-core, through `who-iris/platform.ts` and core's `scripts/platform.ts`. The `NOT_YET_SHIMMED` entry for who-iris is gone.
- GAP 1: `subscribed-trees.ts` sorts each subgraph into held, referenced or could-not-determine; a could-not-determine subgraph fails the build. Held trees are symlinked at the instance's declared paths and mounted by mount-instance-docs and compose-docs.
- GAP 2: `subscribedTile` reads the substrate's avatar at the pin, and links the instance page when a held directory can be mounted.

The cutover, in the same change that removes `who-iris/`, needs three steps:
1. Subscribe `harnesses: ["who-iris"]` with `subgraphs: ["who-iris-site", "who-iris-docs", "library"]`.
2. Run `kg:materialize` for each subgraph.
3. Run `kg:instantiate who-iris`.

#2326 (0mpw) owns adding `mountedInstanceRoots(scope)` to `topLevelDeclarations`.

