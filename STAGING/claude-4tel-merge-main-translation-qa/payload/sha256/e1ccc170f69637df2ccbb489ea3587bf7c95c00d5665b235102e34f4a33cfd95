---
# folio-assistant-yywu
title: 'Repo root cleanup: excise root tools/ and docs/; move stray .beans/ bean into beans/defs'
status: todo
type: task
priority: normal
created_at: 2026-10-06T18:05:32Z
updated_at: 2026-10-06T18:14:54Z
parent: folio-assistant-7x5n
---

Owner ruling 2026-10-06 (this session): 'excise tools/ docs/ it's confusing'.

Audit (read-only, 2026-10-06): root tools/ is a 1-line barrel re-exporting cat-harness/tools that NOTHING imports (the apparent consumers resolve ../tools relative to cat-harness/scripts/); root docs/ is an empty overlay composed over cat-harness/docs/ (owner ruling 2026-09-21), holding only .gitkeep + README. .beans/ is a leftover of the 2026-09-18 .beans->beans rename holding one bean (mcsm) the tooling cannot see.

## Todo
- [ ] tools/: drop the root-tools entry from folio-assistant.json and the tsconfig tools/**/*.ts include; move the two files out preserving history (never-delete rule); fix the stale 'five modules' text in cat-harness-tools/scripts/check-undeclared-files.ts; regenerate harness.json and subgraph READMEs.
- [ ] docs/: retire the root-docs overlay — compose-docs.ts, graph-tiles.ts, nav-label.ts, derive-po.ts, translation-index.ts, gen-auto-docs.ts and compose-docs.test.ts stop looking for it; drop the root-docs entry.
- [ ] .beans/: git mv the mcsm bean into beans/defs/, remove the empty directory.
- [ ] gates: tsc, check:undeclared-files, check:declared-paths, check:declared-dirs, readme:subgraphs:check, uml:overview:check.

## Done when
The root holds no tools/, docs/ or .beans/, and every gate is green.


**Owner ruling 2026-10-06, added:** interaction/interaction.json -> migrate into the harness instance config for now (a whole directory is heavy for one file); a follow-up bean decides its final home (it holds per-person preferences, keyed by person, but is read repo-wide).


**Owner ruling 2026-10-06, reversing the line above:** do NOT move interaction.json into the harness config. interaction/ stays as it is.
