---
# folio-assistant-57mn
title: qa-sweep loads contributions from cat-harness/ and registers 0 contributed checkers
status: completed
type: bug
priority: high
tags:
    - qa
created_at: 2026-09-29T23:57:45Z
updated_at: 2026-09-30T00:13:13Z
parent: folio-assistant-zzmr
---

Found while building #1492 (PR #1515). Owner chose a separate small PR (2026-09-29).

**Measured:** qa-sweep.ts called loadContributions(INSTANCE_ROOT), and INSTANCE_ROOT is cat-harness/, which declares no dependencies. So a real sweep registered 0 contributed checkers, and folio-assistant-sci's proof-compile-cost and proof-no-cost-regression never ran. qa-checker-discovery.test.ts passed because it loads from the repository root, so the test and the tool disagreed about the root.

**Fix:** contributionsRoot() in content/pipeline/repo-root.ts gives the folio's root (findContentRepoRoot()), falling back to the repository root when that lookup lands on the platform's own cat-harness/. qa-sweep loads from it; INSTANCE_ROOT stays the path-normalisation anchor. The same rule is in the MCP server in #1515, which should switch to this helper once both merge.

## Todo
- [x] contributionsRoot() helper
- [x] qa-sweep uses it
- [x] contributions-root.test.ts: a control (cat-harness/ yields neither cost checker) and the fix (contributionsRoot() yields both)
- [x] point the MCP server at contributionsRoot() too (done in #1515 after #1523 merged)

## Summary of Changes

- #1523 (merged ad37c539d): contributionsRoot() in content/pipeline/repo-root.ts; qa-sweep loads contributions from it; contributions-root.test.ts with a control (cat-harness/ yields neither cost checker) and the fix (both registered).
- #1515: the MCP server now uses contributionsRoot() instead of an inline copy of the same rule, so there is one rule in one place. Verified on the real server: tools/list gives 13 tools including lean_formal_edges.
