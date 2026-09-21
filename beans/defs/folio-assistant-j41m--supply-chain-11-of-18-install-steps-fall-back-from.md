---
# folio-assistant-j41m
title: 'SUPPLY CHAIN: 11 of 18 install steps fall back from --frozen-lockfile to an unpinned resolve, and there is no audit or dependabot'
status: todo
type: task
priority: high
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

## Measured 2026-09-21

**11 of 18 install steps defeat their own pin.**

    bun install --frozen-lockfile || bun install
    bun install --frozen-lockfile 2>/dev/null || bun install

in `lean_ci`, `docs-site`, `publish`, `qa-sweep`, `feature-staging` (×3),
`blueprint`, `lean-build`, `qa-sweep-nightly`, `section-title-audit`.

`--frozen-lockfile` exists to fail when the lockfile does not satisfy the
manifest. The fallback converts exactly that failure into an unpinned resolve,
silently, with a green step. **A check that degrades to a pass when it fails is
not a check** — the same shape as the five defects fixed elsewhere in this
session, in supply-chain clothing.

Seven steps pin correctly and have no fallback (`upstream-pins`, `ci-health`,
`health-check`, `code-quality-gates` ×2, `jsonld-gen-check`,
`pr-checks-present`), which is the evidence that the fallback is not required
by the toolchain.

**No dependency audit of any kind** — no `npm audit`, `bun audit`, OSV or
equivalent. **No `.github/dependabot.yml`.**

## The honest counter-argument, to be measured not assumed

The fallback was presumably added because `content/` is a submodule or a
generated tree whose lockfile is not always present, and a hard failure there
blocks unrelated work. If so the fix is a **guard on presence** — pin when a
lockfile exists, and report *no lockfile* as its own state — not an unpinned
retry. That distinction is this bean's actual deliverable.

## Done when

- [ ] Each of the 11 sites is classified: needs the guard, or the fallback was
      never load-bearing and is removed
- [ ] `no lockfile` is a distinct reported state, never a silent unpinned install
- [ ] Whether an audit step earns its place here is decided on measured
      evidence — the current dependency surface, its advisory hit rate, and the
      noise cost — rather than because audits are conventional
- [ ] Falsified: a lockfile deliberately desynchronised turns the affected
      workflows red
