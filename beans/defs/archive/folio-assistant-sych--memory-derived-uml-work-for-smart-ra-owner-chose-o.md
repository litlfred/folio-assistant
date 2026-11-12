---
# folio-assistant-sych
$schema: bean/1.0.0
title: 'Memory: Derived-UML work for smart-ra (owner chose option A 2026-10-31): PRs, issues, what waits on what'
status: completed
type: task
priority: low
created_at: 2026-10-31T02:58:51Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `derived-uml-smart-ra.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Derived-UML work for smart-ra (owner chose option A 2026-10-31): PRs, issues, what waits on what


Owner 2026-10-31: prefers UML derived from models over hand-drawn ("native") UML, and wants mechanical steps as registered Tools named by skills/processes. Chose option A (derive everything, phased). Plan: /mnt/project-files/ra-uml-derivation-2026-10-31/plan.md. Thread "Derive smart-ra UML from ArchiMate model".

Phase 1 (2026-10-31; both MERGED 03:32Z as cat-harness 7005066 and tools 4a0d179): litlfred/cat-harness-tools#1065 (Tool archimate-metamodel, "Metamodel in use" page, config `figures` linking document figures to views; issue #1064) and litlfred/cat-harness#829 (Tool def, skill archimate-models update, process ui/archimate-publish.bpmn; issue #828). smart-ra repin + figure map MERGED as smart-ra#170 (f8d210b); validator fix for archimate-relationship-table/v1 merged (tools#1074 ef47e06, cat-harness#832 d79a1bd). Phase 1 done. Open work, tracked in litlfred/smart-ra#166, which also lists follow-ups D2 (UML overview), D3b (core renders live SVG), D4 (actors from components), D5 (data/sequence diagrams).

Filters on the metamodel page: owner chose A (categories + layers), built.

Related: folio-assistant-gdav.

Next phases (owner 03:50Z "keep going on all next phases"), drafts 2026-10-31: D3b core#331 + tools#1077 (figures drawn from view SVG); D2 tools#1079 + cat-harness#837 (`derived: true` nodeSchemas family archimate-model/v1); D4 option A tools#1080 + cat-harness#838 (Tool archimate-actors, Archi property fhir-actor). Options card for D4/D5 (A tags / B config map / C pause) pending; doc ra-uml-derivation-2026-10-31/actors-and-data-options.md. After merge: re-pin core#331 to new tools, then smart-ra. D5: no logical models in smart-ra yet; sequences deferred.


2026-11-01 10:44Z Q-ACT-2 answered A (thread "Drain cat-harness tools and core backlog"; analysis doc https://claude.ai/artifact/H6sEX4TEnje9frbNxcmutS): ACTORS COME FIRST (DAK persona -> L3 ActorDefinition -> architecture). ArchiMate boxes point at existing ActorDefinitions with property `fhir-actor = <canonical>` (like `skosConcept`); tools#1080 becomes a checker (broken/mistyped tags, coverage), never generates FSH; cat-harness#838 skill text says "actors come first; the model points at them". Never generate actors from the model.
2026-11-01: owner merged tools#1079 (9db69b3) and #1077. cat-harness#837 stays red until folio-assistant index.lock.json pins tools >= 9db69b3 (its CI mounts tools from that lock); asked the Code-move thread to re-pin.
2026-11-01: core#331 merged (9d0d868). smart-ra#220 re-pins core 7a38edf + tools 6393b3e + cat-harness 35150dd for live figures. Re-pin trick: new core needs new tools, so replace the cat-harness-tools/ mount by a clone at the new sha before `remote-mount.ts --fresh`.
2026-11-01 21:17Z: D4/D5 card A. Owner: models rendered from KG content. Detangle filters -> tools#1338.
21:27Z: owner chose B = WHOLE MODEL FROM THE GRAPH (Archi keeps layout only). Design: /mnt/project-files/ra-uml-derivation-2026-10-31/model-from-graph-design.md (term `focus` = ArchiMate element; Tool archimate-from-graph matches by skosConcept, never moves boxes, --check/--coverage). Card asks where relationships live (A term focus, rec / B separate file / C prose). smart-ra content waits for #215 + content pause.
core#568 (issue #567): focus=ArchiMate element + Tool archimate-from-glossary, draft, watched.
21:52Z: owner A on draft-stacked: smart-ra#224 (branch claude/ra-model-from-glossary, base #215 branch) seeds 12 component focus + model docs/2 renames; HOLD with #215; red until core#568 merges + smart-ra core re-pin.
11-02 07:40Z: tools#1338 merged (drain). smart-ra#220 closed as superseded: main #227 pins core 633d230 (has #568) and ignores build/. Left: #224 held with #215; cat-harness#837 waits fa lock re-pin; D5 waits.
