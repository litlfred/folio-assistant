---
# folio-assistant-uxn1
title: 'STANDALONE: code assumes cat-harness sits at <repo>/cat-harness (role-graph scenariosSubdir, skill-definitions-dir, gen-navbar-include)'
status: in-progress
type: bug
created_at: 2026-10-06T09:15:52Z
updated_at: 2026-10-06T09:15:52Z
parent: folio-assistant-iirv
---

Cluster R of the cat-harness standalone rehearsal (#2268, ho66): about 10 tests fail standalone because code builds paths as join(repoRoot, 'cat-harness', ...) instead of resolving the instance root from its declaration. Standalone, cat-harness IS the repository root, so no actors are found (role-graph.ts scenariosSubdir) and prov-record fails twice. The same assumption is in skill-definitions-dir.ts and gen-navbar-include.ts. Coordinating session: keep this in A's lane; #2267 does not touch these three files. Session https://claude.ai/code/session_01FrpbCpM7BWxGCPsu618MLr.

## Done when
- [ ] each of the three resolves cat-harness's root by declaration (instance root), not a literal 'cat-harness' segment
- [ ] the cluster's tests pass standalone and in the monorepo; baseline lowered
- [ ] gates green
