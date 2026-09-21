---
# folio-assistant-j41m
title: 'SUPPLY CHAIN: 11 of 18 install steps fall back from --frozen-lockfile to an unpinned resolve, and there is no audit or dependabot'
status: in-progress
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

- [x] Each of the 11 sites is classified — **two classes, not one**, and the
      second is worse than this bean recorded (below)
- [x] `no lockfile` is a distinct reported state — the guard emits
      `::notice::` for no folio, pins when a lockfile is there, and
      `::warning::` when it installs unpinned. Three states, never silence
- [x] `check:lockfile-pinning` holds the line, registered in `package.json`
      and `code-quality-gates.yml`. Falsified against the REAL workflows:
      restoring one fallback turns it red and names the file and line
- [ ] Whether an audit step earns its place — **measured, and left as the
      owner's call** (below). Not shipped: adding a CI step on my own initiative
      is the speculative change this repo forbids

## Two classes, and class A is not about lockfiles at all

**Class A — 4 sites** (`lean_ci`, `publish`, `blueprint`, `lean-build`):

    cd content && bun install --frozen-lockfile 2>/dev/null || bun install

In bash, when `cd content` fails the `&&` short-circuits with **cd's** exit
status, so `||` fires and `bun install` runs in the **current** directory —
the repository root. `2>/dev/null` hides cd's *"No such file or directory"*.

**This repository has no `content/`.** So those four steps silently installed
the wrong project's dependencies, unpinned, and reported success. Verified by
running the construction, not by reading it.

**Class B — 7 sites** at the repository root, where `bun.lock` exists. Here the
fallback is purely the defeated pin. Seven OTHER steps pin with no fallback,
which is the evidence it was never load-bearing — so class B simply lost it.

## The audit question, measured

| | |
|---|---|
| direct dependencies | 19 |
| direct devDependencies | 9 |
| resolved packages in `bun.lock` | ~373 |
| declared at an **exact** version | **1 of 28** |
| `bun.lock` | 87 KB |

**The finding is the 1 of 28, not the 373.** A lockfile pins the resolved tree,
so 373 transitive packages are reproducible — but 27 of 28 direct dependencies
are declared as ranges, which means the lockfile is the *only* thing holding
them, and `bun install` without `--frozen-lockfile` silently moves them. That
is exactly what the 11 fallbacks were doing.

So the pin fix above is worth more here than an audit step would be, and an
audit's value is a separate question from its noise cost, which nobody has
measured on this corpus. **Recorded for the owner rather than acted on.**
