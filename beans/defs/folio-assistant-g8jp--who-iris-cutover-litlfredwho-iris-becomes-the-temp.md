---
# folio-assistant-g8jp
title: 'who-iris cutover: litlfred/who-iris becomes the (temporary) authoritative source; folio-assistant reads it by remote subscription'
status: in-progress
type: feature
created_at: 2026-10-06T19:12:02Z
updated_at: 2026-10-06T19:12:02Z
parent: folio-assistant-7x5n
---

Owner rulings 2026-10-06: 'go ahead and move who-iris/ repo over to litlfred/who-iris where it is (temporary) authoritative source. but i still want to see remote subscription under litlfred/folio-assistant'; 'i dont want git submodules!'; 'fix gaps and go' (code deps: option 1 — the who-iris repo pins the monorepo as a package, github:litlfred/folio-assistant#<sha>, switching to litlfred/cat-harness + folio-assistant-core once seeded). This is the owner's authorisation that clears 'seeding held' (cat-harness.json knownSubstrates row) for who-iris, and the S8 per-instance OK (bean w0at) for moving its in-tree copy to fsh-guts.

## Plan
- [ ] #2307 merges first (it regenerates ~409 who-iris JSON-LD files; seed:ready reported could-not-determine because of it).
- [ ] seed:ready --layer who-iris --rehearse (standalone green beside its needs).
- [ ] Seed litlfred/who-iris (empty repo): minimal initial commit on main, then seed via git subtree split --prefix=who-iris on a branch + PR; fix livesAt; 7 direct climbs into cat-harness/core (platform.ts, themes, two tests) -> the pinned package; CI there for iris:pages:check, iris:covers:check, dc:render:check, check:catalogue, id-lookup:check, tests.
- [ ] GAP 1: the docs-site build mounts an instance's docs/site from a SUBSCRIPTION's materialised tree (mount-instance-docs, compose-docs, docs-site.yml) — today only from the in-tree instance.
- [ ] GAP 2: harness tiles / navbar from kg:instantiate (who-iris.config.json replaced).
- [ ] folio-assistant: kg:subscribe litlfred/who-iris@<seed sha> (first committed subscription), kg:materialize docs/site/library as needed; repoint/remove the 5 CI gates, 2 path filters, ~17 checkout tests, folio-assistant.json instance list, knownSubstrates, state-on-main-baseline row, NOT_YET_SHIMMED entry.
- [ ] Move in-tree who-iris/ to fsh-guts with a node recording repo + pinned SHA; regenerate.

## Done when
litlfred/who-iris builds and checks green on its own; folio-assistant has no who-iris/ directory, reads it through a committed subscription, and its site still serves /docs/who-iris/.
