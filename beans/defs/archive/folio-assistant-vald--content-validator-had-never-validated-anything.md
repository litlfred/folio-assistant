---
# folio-assistant-vald
title: 'The content validator had never validated anything — three defects, mutually concealing'
status: completed
type: bug
priority: high
created_at: 2026-08-07T23:20:00Z
updated_at: 2026-08-07T23:35:00Z
---

Fixed by session `3bada08b` on branch `claude/agent-4673-validation-9hffrd`.

Found while measuring the tsconfig gap (bean `folio-assistant-tsca`).

1. **Default target pointed into the platform.** `validate.ts`'s CLI defaulted
   to `join(import.meta.dir, "../objects")`. A folio embeds folio-assistant as
   a symlinked subdirectory, so `import.meta.dir` resolves into the PLATFORM
   tree — the default was `<folio-assistant>/content/objects`, which does not
   exist. Same defect class as the `q-usage-audit.ts` root bug already fixed
   with `findContentRepoRoot`.

2. **Finding nothing was a `warning` returning `valid: true`.** So the CLI
   printed `✓ Valid — 1 issue(s)` and exited 0 over an empty corpus.

3. **`ReferenceError: dir is not defined`** at the Phase 2 `ConstraintContext`
   — the parameter is `objectsDir` and a rename missed this site (landed in
   `109a4ff`, PR #38). ANY run reaching a single block threw.

(1) and (2) concealed (3): the empty-corpus early return fired before Phase 2
was ever reached, so the crash was unreachable via the default path and the run
reported success. The folio's real entry point, `qou/scripts/run-validate.ts`,
passes a real corpus and so hit the crash directly.

Also fixed: `REPO_ROOT` for the `lean-file-exists` Lake-tree basename fallback
was `resolve(import.meta.dir, "../..")` — the platform root — while
`LEAN_PACKAGES.lakeRoot` is content-repo-relative, so that fallback scanned a
tree that does not exist. Two stray debug `console.log`s from the same PR
removed.

Compounding this, seven constraint checks in `schemas/constraints.ts` were
themselves throwing `ReferenceError` on `ctx` (see `folio-assistant-tsca`), so
even a reachable Phase 2 would have failed. Both are fixed; `md-exists` now
reports real findings.

Verified: refuses with exit 2 from the platform; reports 12 real
`Missing companion` findings with exit 1 on `content/fred2005-formal-groups`
via both entry points. Regression tests in
`scripts/tests/validate-roots.test.ts` pin that validating nothing is a
FAILURE and that a non-empty corpus reaches Phase 2 without throwing — the
second was confirmed to fail when the `dir` bug is reintroduced.

Not addressed here: `validate.ts`'s own CLI cannot validate a paper that uses
`\value{}` directives, because the value registry is injected by the folio
(`configureValueRegistry`). `qou/scripts/run-validate.ts` is the entry point
that does that. The direct CLI throws a clear, self-describing error in that
case rather than misreporting, which is acceptable.
