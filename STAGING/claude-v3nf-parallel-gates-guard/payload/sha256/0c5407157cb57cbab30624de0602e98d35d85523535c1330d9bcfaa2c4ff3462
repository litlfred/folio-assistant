---
# folio-assistant-uxn1
title: 'STANDALONE: code assumes cat-harness sits at <repo>/cat-harness (role-graph scenariosSubdir, skill-definitions-dir, gen-navbar-include)'
status: completed
type: bug
priority: normal
created_at: 2026-10-06T09:15:52Z
updated_at: 2026-10-06T10:01:36Z
parent: folio-assistant-iirv
---

Cluster R of the cat-harness standalone rehearsal (#2268, ho66): about 10 tests fail standalone because code builds paths as join(repoRoot, 'cat-harness', ...) instead of resolving the instance root from its declaration. Standalone, cat-harness IS the repository root, so no actors are found (role-graph.ts scenariosSubdir) and prov-record fails twice. The same assumption is in skill-definitions-dir.ts and gen-navbar-include.ts. Coordinating session: keep this in A's lane; #2267 does not touch these three files. Session https://claude.ai/code/session_01FrpbCpM7BWxGCPsu618MLr.

## Done when
- [x] each of the three resolves cat-harness's root by declaration (instance root), not a literal 'cat-harness' segment
- [x] the cluster's tests pass standalone and in the monorepo; baseline lowered
- [x] gates green

## 2026-10-06 — landed in #2270 (3fe5b86); 3 tests, not ~10

- instanceRootNamed(repoRoot, name) in instance-roots.ts resolves cat-harness's root by declaration in both layouts; role-graph.ts scenariosSubdir, skill-definitions-dir.ts conventionsDir and gen-navbar-include.ts use it (or instanceRootFor). Test: cat-harness/schemas/instance-root-named.test.ts (the standalone case fails under the old join).
- standalone:baseline (Bun 1.3.14) 195 → 192, no new failures. Fixed: prov-record ×2 (this bean) and gen-slice-sqlite (already passing on main).
- The cluster was estimated at ~10 from #2268's grouping; only these 3 were this defect. The other ~7 tests grouped as 'R' still fail standalone and have a different cause, not yet named — re-group them from the baseline before claiming them here.
- Done-when 1 met; 2 met for the tests this defect caused; 3 met (CI green on 608b795).

## Summary of Changes
Resolved cat-harness's root by declaration (instanceRootNamed) in role-graph.ts, skill-definitions-dir.ts and gen-navbar-include.ts; #2270 merged green. Standalone baseline 195 → 192.
