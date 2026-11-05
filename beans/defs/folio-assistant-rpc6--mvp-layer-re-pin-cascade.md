---
# folio-assistant-rpc6
$schema: bean/1.0.0
title: 'MVP Phase 4: re-pin the layers on the 11 site PRs, bottom-up'
status: in-progress
type: task
priority: high
created_at: 2026-11-01T21:32:00Z
updated_at: 2026-11-05T16:40:03Z
parent: folio-assistant-rwmf
---

Thread "Prepare the layer re-pin cascade" (cmsg_017WNUkNK8kdDziPK58Pv6G9FDPvN5ktTn4HS2iruRVeZj), session_01Qmmkt5oYY58dMFeUfYD8ee. Epic litlfred/folio-assistant#2894. Merge window to 2026-11-03 00:40Z (freeze lifted 17:54Z).

## Done
- Merged site re-pins: smart-base-clinical#17, smart-hiv#23.
- Merged cascade fixes: cat-harness#966, #973, #979, #983; smart-base#290, #295; folio-assistant#2914; cat-harness-tools#1409.
- Owner tap Q-PIN-DTHSC-1 A (18:47Z): dth-sc#18 may merge its slash-IRI block regen past check:corpus-gate.

## In progress (all pushed)
- Round 8 (cat-harness ea6ace8, tools 109b850, core 3c13890, smart-base db7f311, fhir-harness c702c34, bootstrap-tools aa25987) on: smart-ra#228 (branch claude/repin-mvp-round2), smart-trust#137 (claude/repin-mvp-round5), smart-immunizations#106, smart-immunizations-uganda#18, smart-ips-pilgrimage#8, smart-trust-phw#26, dth-hrh#91, dth-phc#29, dth-sc#18 (claude/repin-mvp-layers).

## Next
- Merge each site PR on green (reds main already has are allowed).
- who-iris#165 (slash wave, dth-hrh L2 pilot thread) waits on fa train #2921; then one more bump clears dc:render / glossary:pot / gen:jsonld.
- Residual: uganda bpmn:checklist, foreign-paths (tools tool-release.ts:88-89), glossary-ledger; libraries:check zod skew clears with the train.
- Hand fa's final re-pin to the train thread; Phase 4b render bottom-up (smart-ra >= 15 min apart).
- Scripts: /tmp/claude-0/r8.sh pattern (seed via remote-mount --seed, keep key order, workflow-pins --write). Memory: repin-cascade-mvp-2026-11-01.md.

_2026-11-05T12:58:17Z_ — Picked up by session https://claude.ai/code/session_01VQDpPcVohXoCeZb3TEMGfp (stalled-pickup D: smart-ra#228, smart-immunizations#114, dth-sc#18, dth-phc#29, smart-ips-pilgrimage#8, smart-immunizations-uganda#18, dth-pc#18). check:bean-parents is green now (44 open beans; rpc6 hangs from milestone rwmf, bmat from npuo). Blocked: add_repo for smart-ra and smart-immunizations was refused by the permission check in this session, so no site repo is reachable yet; asked the owner.

_2026-11-05T13:18:15Z_ — Owner card (this session): "1. Attach repos"; all 7 site repos attached. smart-immunizations#114 → 10c2bb2: all 8 layers re-pinned to mains (cat-harness 6e0dc31 has the sdlc/ layout that smart-base/fhir-harness link to); check:subgraphs passes locally (the PR's only new red). smart-ra#228 → 82268b1 (round 11: cat-harness 6e0dc31, tools c1c1d53, core 3822d57). Locally still red: who-iris 88 stale keywords.json; core check:command-paths (3) and foreign-paths ("folio" literals in public-comment.ts, review-anchors-from-folio.ts); cat-harness 2 stale bpmn checklists and an ihris/subgraphs/skills digest mismatch; smart-ra's own archimate visualiser path (check:subgraph-coverage). Waiting on CI to split new from main's. Re-pinning dth-sc#18, dth-phc#29, smart-ips-pilgrimage#8, smart-immunizations-uganda#18, dth-pc#18 by script (merge main in, seed each declared layer to main).

_2026-11-05T13:38:11Z_ — Owner card: "1. Attach 4" (cat-harness, tools, core, who-iris attached). Pushed, CI queued: smart-immunizations#114 10c2bb2; smart-ra#228 253718b (round 11 + dpi-h-ra.json archimate visualiser writer, fixes check:subgraph-coverage + smart-ra's 2 keywords.json); dth-sc#18 a8a22ed; dth-phc#29 35fe71b; smart-ips-pilgrimage#8 d388ddd and smart-immunizations-uganda#18 ccc2ade (merged main in: conflicts only in pin files, took main's, then re-pinned); dth-pc#18 9f3809e (workflow-pins also pinned a layer-pr-checks @main + tools-ref: main — owner to OK before merge). Upstream fix PRs for #228: cat-harness#1054 (generated: 2 bpmn checklists, 25 bootstrap .pot, translation obsolete/pot; adding 62 keywords.json); who-iris#181 (24 keywords.json); cat-harness-tools#1518 (qa-refresh claims root test/results/library-qa — uml:overview red). ihris digest already fixed on cat-harness main (#1044). Core command-paths/foreign-paths: agent working. Order: merge the 3-4 layer PRs, then re-pin #228 to them.

_2026-11-05T13:38:58Z_ — Owner card: dth-pc#18 "1. OK, merge" — may merge on green with the layer-pr-checks @main call pinned to the lock (tools-ref: main dropped).

_2026-11-05T13:48:22Z_ — Owner: "merge when green"; a merge watcher (merge on all-checks-passed, stop on red) runs over the 7 site PRs and the 4 fix PRs. Fix PRs for smart-ra#228: cat-harness#1054 e318fb7 (+62 cat-harness keywords.json), who-iris#181 84a0728, folio-assistant-core#647 89915b2 (21 foreign-path literals in 10 files through folioDir/storeDirOf/archimateConfigPath/referenceDirs; command-path-ok markers; NOTE behaviour change: glossary-validate skips an instance whose archimate config is in an undeclared dir), cat-harness-tools#1518 df7b772 (qa-refresh root library-qa + 3 tools foreign-paths literals). fhir-harness fhir-questionnaire-wireframe.md:96 dead command path is old (same at both pins) — not yet judged new or main's.

_2026-11-05T14:00:08Z_ — smart-immunizations#114 at 10c2bb2 (all 8 layers at mains): 11 new reds, all from cat-harness 6e0dc31 (sdlc/ relocation) and the layers above it not yet regenerated: bpmn:checklist, translate-bpmn:bootstrap, translation obsolete/pot/block-qa, process-index (sdlc/processes/*.bpmn not in the published processes subgraph), library:viz (avatar kg-folio-asst-#-#-#.webp), kg:materialize + materialized-fixity (ihris; fixed on cat-harness main #1044), core check:glossary (core + who-iris generated glossaries), branch:readme (tools health state branch). Regen going onto cat-harness#1054 and a new core/who-iris glossary PR; #114 then re-pins onto them.

_2026-11-05T14:09:08Z_ — Owner card "1. Treat as known": a site re-pin may merge when its only reds besides main's are these 3 KNOWN lower-layer reds: (1) cat-harness-tools:translation:block-qa:check — translation-coverage drop after cat-harness 7c759481 ("Say work item, not bean") reworded docs/concepts/architecture.md (37/61 strings, 5 locales) and docs/guides/agent-onboarding.md (fr 57/73); needs translators. (2) check:process-index and (3) library:viz:check — red only because CI skips publish:derive:publish (gen-fsh-guts-viz: cat/cat-harness/fsh-guts state branch not mounted), so the gitignored docs/subgraph/** and docs/assets/library/ avatars are unbuilt; both pass once built (subgraph:jsonld, library:viz). Not covered by the ruling: branch:readme:check on cat/cat-harness-tools/health (fix: bun run cat branch:readme --push cat/cat-harness-tools/health). cat-harness#1054 stays at e318fb7.

_2026-11-05T14:24:33Z_ — Glossary regen (bun run cat glossary:page, generated at cat-harness a03d6b3, tools 13366a5, bootstrap 12fa6d5, bootstrap-tools 3a406fb, core 21da85c, who-iris 68e3a89): folio-assistant-core#648 d21b9a3 (9 files), who-iris#183 8f25812 (2), cat-harness#1061 5f3792c (3 skos.jsonld core's glossary:page writes). Layer repos' own CI never sees stale glossaries: derive:publish rewrites them in prep; in site runs derive:publish exits 1 (gen-fsh-guts-viz: fsh-guts state branch unmounted), which is why sites see them. Also stale but not yet flagged by a site: fhir-harness 3, smart-base 3, folio-assistant-sci 2 glossary/generated files. Sites must re-pin to these merges + tools >= 13366a5, bootstrap-tools >= 3a406fb. Merge watchers on all 13 PRs.

_2026-11-05T15:10:39Z_ — Owner card "1. Freeze one set": after the 7 fix PRs merge (cat-harness#1054, #1061; who-iris#181, #183; cat-harness-tools#1518; core#647, #648), pick ONE commit per layer and re-pin all 7 sites to that set; fix shared layer reds once in their repos; merge each site when its only reds are main's or the known 3; do not chase mains that move after the freeze. Site PR reds before the freeze are moot. dth-sc#18 a8a22ed preview of the next wave (18 new): corpus-gate (dth-sc's, owner OK Q-PIN-DTHSC-1 A), declared-dirs (smart-base templates/ absent; dpi-h-ra references/ absent), lockfile-pinning (stale baseline repin-train.yml), slice:sqlite (publish payloads), split:baseline (skills math-md-authoring etc. no longer resolve), subgraph-coverage (cat-harness sdlc-processes, sdlc-skills, work-plan* + smart-base-templates owe serialisations), who-iris command-paths (iris-oxigraph/iris-cdn scripts), core foreign-paths (back-matter-order.ts etc.). dth-pc#18 9f3809e also red (not yet read).

_2026-11-05T15:18:29Z_ — MERGED who-iris#181 as 0237087 (24 keywords.json). Its only new failure was translation:block-qa:check (cat-harness agent-onboarding.fr gap, a known red per the owner ruling); comment on the PR. Watcher (merge on all-green only, stop on red after all checks finish) runs over cat-harness#1054, #1061, who-iris#183, tools#1518, core#647, #648; known-red cases are judged by hand.

_2026-11-05T16:14:06Z_ — cat-harness#1054 e318fb7: 1 new red, bpmn:checklist:check: the 2 regenerated checklists followed bootstrap 12fa6d5, but cat-harness CI mounts bootstrap at the index pin c90ef45. Pushed fc16a9e keeping main's two checklists. FREEZE SET: bootstrap = c90ef45 (index pin), not bootstrap main, so the sites agree with cat-harness's committed bootstrap-derived artefacts.

_2026-11-05T16:18:07Z_ — MERGED folio-assistant-core#647 as ba172dd (all green: 18 passed, 2 skipped): 21 foreign-path literals through declarations, command-path-ok markers.

_2026-11-05T16:28:10Z_ — cat-harness-tools#1518 df7b772: 1 new test failure, its own: qa-refresh.test.ts "every family is under a declared qa directory" did not exempt the root test/results/ the new glob names. Pushed c6566f6 widening the exemption to the root instance (30/30 pass locally in smart-ra's tree).

_2026-11-05T16:33:28Z_ — MERGED who-iris#183 as 54af134 (all green: 17 passed, 2 skipped; 2 regenerated glossary files). Merged so far: who-iris#181, #183; core#647. Open: cat-harness#1054 (fc16a9e), #1061; tools#1518 (c6566f6); core#648.

_2026-11-05T16:40:03Z_ — core#648 went green at d21b9a3 but then conflicted with main (main regenerated cat-harness and core kg-bpmn-activities glossaries after #644). Merged main in, kept main's two copies: 9570a32; CI re-running. Disk was full (scratch trees of finished agents, ~7G); deleted them, survey agent's freeze/ tree kept.
