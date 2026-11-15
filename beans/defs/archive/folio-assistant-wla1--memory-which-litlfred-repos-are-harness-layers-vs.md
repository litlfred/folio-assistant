---
# folio-assistant-wla1
$schema: bean/1.0.0
title: 'Memory: Which litlfred repos are harness layers vs content instances (checked 2026-11-08); "instance" in schemas means any declared layer'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:18:22Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `repo-roles-harness-vs-instance.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Which litlfred repos are harness layers vs content instances (checked 2026-11-08); "instance" in schemas means any declared layer

Checked 2026-11-08 (thread "Classify smart-trust-phw as harness or instance", cmsg_017WNUkNK8kdDziPK58Pv6G9UQrkGjSieN4cBfQamDcCk9) from each repo's `<name>.json` declaration.

- In cat-harness docs (docs/concepts/harness.md) every declared layer is an "instance"; `index.config.json` lists all mounts under `instances`. "Harness" is a role, not a declared type: there is no HarnessKind yet. "Instantiated" = a `<name>.config.json` at the root (only dth-hrh, dth-sc, dth-phc have one).
- Harness / tooling layers: bootstrap, bootstrap-tools, cat-harness, cat-harness-tools, folio-assistant-core, fhir-harness. Base / corpus layers: smart-base, who-iris, folio-assistant-sci.
- Content instances on smart-base: smart-trust-phw, smart-trust, smart-immunizations (FHIR IGs, "harnessed instance of smart-base"), smart-ra (dpi-h-ra), dth-*.
- smart-trust-phw is correctly an instance (its AGENTS.md: "It has no harness of its own"). Confusion source: pin-move PR tables (e.g. smart-trust-phw#47) label every row "instance", including cat-harness and fhir-harness.
- User said "explain first, don't change". Card asked: A change nothing + label rows by role in future PR tables (rec), B also propose a declared kind field in cat-harness, C reclassify phw as a harness.

2026-11-08 07:21Z user model: "an instance is an instance of a node kind. a harness should be one kind. index.config.json should declare which harnesses are instantiated on the repo." Then: "review all existing KG corpus, what to do to fix up language?" Sweep: ~28k lines say "instance" across 8 repos; repo-sense code ids instanceRoot (2087 lines) / instanceRoots (610); prose "instance declaration" 176, "root instance" 171, "harness instance" 85, "content instance" 63, asset role instance-readme 57. cat-harness-tools schemas/kg/index-config.ts already says `instances[]` = "which harnesses are instantiated", but every mount is listed there (phw lists 9 incl. itself, landing smart-base). Proposed phases: 1 vocabulary (glossary+harness.md), 2 schema (Harness node kind; index.config `harnesses` vs mounts, `instances` alias + migrate), 3 prose sweep, 4 code renames later. Cards asked: scope + word for a repo layer (rec "layer"). No pushes during swarm hold for fa#3034.
- 07:25Z Q scope answered B (all four phases incl. code renames). Word card (layer/package/module) pending.
- 07:25:59Z word answered A: Layer. Next: cat-harness tracking issue + P1 draft locally.
- 07:30Z P1 committed locally (cat-harness branch claude/instance-layer-vocabulary, 2b96fac amended); issue cat-harness#1138 opened. Push scheduled 07:57Z after hold. P2 shape: index.config `layers` (mounts, alias instances) + `harnesses` (instantiations naming their Harness definition). Card Q asks migration content: A only real instantiations (rec), B keep all, C per repo.
- 07:58Z P1 pushed as draft cat-harness#1143 (subscribed). P2 waits on migration card.
- 09:19Z migration card answered A: list only real instantiations (landing + entries with config / <name>.config.json). P2 started in cat-harness-tools.
- ~09:45Z P2a draft litlfred/cat-harness-tools#1700 (branch claude/index-config-harnesses-layers, subscribed). Rollout: repos migrate (P2b) only after all checkouts pin tools with #1700 (mounted layers' index.config is read by composing checkout; schema strict). Preview: phw/smart-trust/smart-immunizations -> [smart-base] (their own tile drops); fa keeps 7.
- P3 card posted (~09:50Z): A 8 per-repo workers (rec), B me alone, C safe phrases only. cat-harness hand-authored: 4731 'instance' lines in 495 files.
- 09:31Z P3 card A: 8 background workers launched (brief /tmp/claude-0/p3-brief.md, branch claude/p3-instance-to-layer per repo). dth-*/smart-ra/smart-trust/smart-immunizations not in P3 sweep (content hold on dth-*/smart-ra).
- P3 phw: draft smart-trust-phw#53 reviewed OK (22 lines/5 files).
- P3 bootstrap: draft bootstrap#47 (39 lines/16 files); generated tables stale (skills/README.md, README.md kg:files, AGENTS.md skills:index) — regenerate with bootstrap-tools from /tmp/claude-0/full after all workers done.
- P3 bootstrap-tools: draft bootstrap-tools#84 (113 lines/30 files, comments+md). Workers' bun install denied; I must run tests myself. Follow-ups: .feature (62 lines), bpmn docs, package-manifest.json.
- P3 smart-base: draft smart-base#327 (134 lines/54 files). CONFLICT: 'layer' also means WHO SMART L1/L2/L3 knowledge layers (the-three-layers.md) — raise with user.
- P3 fhir-harness: draft fhir-harness#312 (316 lines/70 files). Left generator-fed sources (declaration descriptions, bpmn, skill front matter) for a regen pass.
- 09:40Z SWARM HOLD (queue 43>35): no pushes/PRs until Merge Manager release. Remaining workers (cat-harness, cat-harness-tools, fa-core) told to commit locally only. 5 P3 drafts already up: phw#53, bootstrap#47, bootstrap-tools#84, smart-base#327, fhir-harness#312.
- P3 fa-core: draft folio-assistant-core#684 (655 lines/151 files; opened before hold arrived). Many generated files stale (READMEs, checklists, glossary/generated).
- P3 cat-harness: committed locally fa00a5c at /home/user/p3/cat-harness (368 files, 1692 lines), NOT pushed (hold). Push + draft PR after Merge Manager release.
- P3 cat-harness-tools: committed locally 1613d66 at /home/user/p3/cat-harness-tools (1052 files, comments only), NOT pushed; PR body at scratchpad/p3-cat-harness-tools-pr-body.md. All 8 workers done ~09:50Z. Raised L1-L3 'layer' collision card.
- 09:44Z coordinator: hold bootstrap-tools#84 re-run until swarm hold lifts (10:11Z reminder: check hold first).
- 09:44Z clash card A: repos=layer; WHO SMART L1-L3 = 'knowledge layers'. Reword smart-base spots + add row to P1 table (local until hold lifts).
- Local unpushed (hold): cat-harness P1 90db5de (knowledge-layer note) on claude/instance-layer-vocabulary; smart-base 17fa8f4 at /home/user/p3/smart-base (generated who-smart-content-types.md hand-mirrored); cat-harness P3 fa00a5c; cat-harness-tools P3 1613d66.
- 10:05Z hold lifted: pushed cat-harness#1148, cat-harness-tools#1706, P1 #1143 note, smart-base knowledge-layer commit; reran bootstrap-tools#84 readme job.
- 10:12Z CI: bootstrap-tools#84 readme failed a 3rd time (setup-bun 504, infra, no re-run). cat-harness-tools#1706 CodeQL red (24 alerts) is old code in files with touched comments, not from this PR; commented, alerts API 403. #1143 green.
- 13:39Z user marked ready for review: fhir-harness#312, smart-base#327, smart-trust-phw#53 (full CI now runs).
- 13:41Z user marked bootstrap-tools#84 ready for review.
- 13:41Z user marked folio-assistant-core#684 ready.
- 13:43Z user marked bootstrap#47 ready.
- 13:43Z user marked cat-harness#1143 ready.
- 13:46Z user marked cat-harness-tools#1700 ready (P2a).
- 13:46Z user marked cat-harness-tools#1706 ready.
- 13:53Z user marked cat-harness#1148 ready. All 10 PRs now ready (1700 toggled draft->ready 13:51Z).
- 13:56Z fa-core#684: main merged in (4652101), full PR checks green (comment by litlfred account).
- 13:59Z user converted cat-harness#1148 and cat-harness-tools#1706 back to draft (don't mark ready unless asked).
- 13:59:46Z both #1148 and #1706 back to ready (draft toggle = CI re-trigger).
- 14:10Z phw#53 NEW FAILURE readme:subgraphs:check (input/business-processes/README.md embeds the declaration description). Pushed f96593d. Lesson: when declaration descriptions change, the directory READMEs must be updated too; check the other PRs.
- 14:23Z smart-base#327 full checks green (ready comment).
- 14:24Z bootstrap-tools#84 ready comment at 2983c3a.
- 14:30Z #1143 reference-direction gate: P1 text named upper layers (phw/smart-base/fhir-harness) from cat-harness. Fixed d322351 (generic wording). Rule: lower layers must never name higher ones in prose. /home/user/p3/cat-harness now checked out on the P1 branch.
- 14:29Z bootstrap#47 ready comment at 08cb754.
- 14:33Z fhir-harness#312 new test failure: tools standalone fixture byte-copies fhir-harness typologies (ig-ast, fhir-artifact-index, ig-annex). Reverted those 3 in c7509aa; follow-up = reword sources + tools fixture copies together.
- 14:30Z phw#53 green at f96593d (ready comment).
- 14:47Z tools#1700 reference-direction gate (index-config.ts comments named smart-base/fa-core). Fixed 2a28bab5.
- 15:00Z cat-harness#1143 green at d322351.
- 15:04Z fhir-harness#312 green at c7509aa.
- 15:16Z tools#1700 green at 2a28bab.
- 15:27Z ready comments: fhir-harness#312 (c7509aa), cat-harness#1143 (d322351), cat-harness#1148 (5706a9e).
- 15:29Z all 10 PRs have ready comments and are green (CodeQL on #1706 needs maintainer triage). Next after merges: P2b migrations, typology+fixture follow-up, regen pass, P4.
- 17:12Z MERGED: cat-harness-tools#1700 (P2a) and cat-harness#1143 (P1). P2b waits for every checkout to re-pin tools past #1700.
- 17:12Z MERGED: cat-harness#1148, cat-harness-tools#1706, fhir-harness#312.
- 17:12Z MERGED: folio-assistant-core#684, bootstrap#47.
- 17:13Z MERGED: smart-base#327.
- 17:13Z MERGED: smart-trust-phw#53. 9/10 merged; bootstrap-tools#84 remaining.
- 11-09 14:17Z bootstrap-tools#84 ready comment at 0a910d8.
- 11-11 13:04Z MERGED bootstrap-tools#84. ALL 10 P1/P2a/P3 PRs merged. Open: typology+fixture follow-up, regen pass, P2b (after re-pins), P4.
