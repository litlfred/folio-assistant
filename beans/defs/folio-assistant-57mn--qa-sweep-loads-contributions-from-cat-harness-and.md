---
# folio-assistant-57mn
title: qa-sweep loads contributions from cat-harness/ and registers 0 contributed checkers
status: in-progress
type: bug
priority: high
tags:
    - qa
created_at: 2026-09-29T23:57:45Z
updated_at: 2026-09-29T23:57:45Z
parent: folio-assistant-zzmr
---

Found while building #1492 (PR #1515). Owner chose a separate small PR (2026-09-29).

**Measured:** qa-sweep.ts called loadContributions(INSTANCE_ROOT), and INSTANCE_ROOT is cat-harness/, which declares no dependencies. So a real sweep registered 0 contributed checkers, and folio-assistant-sci's proof-compile-cost and proof-no-cost-regression never ran. qa-checker-discovery.test.ts passed because it loads from the repository root, so the test and the tool disagreed about the root.

**Fix:** contributionsRoot() in content/pipeline/repo-root.ts gives the folio's root (findContentRepoRoot()), falling back to the repository root when that lookup lands on the platform's own cat-harness/. qa-sweep loads from it; INSTANCE_ROOT stays the path-normalisation anchor. The same rule is in the MCP server in #1515, which should switch to this helper once both merge.

## Todo
- [x] contributionsRoot() helper
- [x] qa-sweep uses it
- [x] contributions-root.test.ts: a control (cat-harness/ yields neither cost checker) and the fix (contributionsRoot() yields both)
- [ ] after #1515 merges: point the MCP server at contributionsRoot() too
