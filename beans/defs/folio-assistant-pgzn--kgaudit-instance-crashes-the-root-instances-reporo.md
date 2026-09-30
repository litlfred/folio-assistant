---
# folio-assistant-pgzn
title: 'kg:audit --instance . crashes: the ROOT instance''s repoRoot resolves outside the checkout'
status: todo
type: task
priority: normal
created_at: 2026-09-27T08:00:22Z
updated_at: 2026-09-27T08:19:24Z
parent: folio-assistant-1xhc
---

## What was measured

`bun run cat-harness/scripts/kg-audit.ts --instance .` exits 1 before auditing
anything. Measured 2026-09-27 on `main` (b4d85f2cf4) as well as on the branch, so
it is pre-existing and not introduced by the skill-resolution fix that found it:

    ENOENT: no such file or directory, open '/home/user/package.json'
      at rootScripts (cat-harness/scripts/pair-claims.ts:181:26)
      at cat-harness/scripts/kg-audit.ts:2504

## Cause

`kg-audit.ts` computes the repository root by hand:

    const repoRoot = resolve(root, "..");

That is `dirname`, and it is correct for every instance EXCEPT the one declared
at the repository root. `folio-assistant.json` sits at the checkout root, so
`root` is the checkout and `resolve(root, "..")` is `/home/user` — outside the
checkout entirely, where there is no `package.json`.

`schemas/harness-config.ts` already documents this exact trap on
`dependenciesFromNeeds`, which chose the other helper for the same reason:

> `siblingScopeFor`, NOT `repoRootFor`: this is a lookup of SIBLINGS by name,
> and `repoRootFor` is `dirname`, which climbs out of the checkout for the one
> instance declared at the repository root. That made the root instance's
> `needs` derive nothing while its authored edge still resolved — an overlay
> that looked like it worked and held one entry.

So this is that bug class at a second call site, with a hand-rolled `dirname`
rather than even `repoRootFor`.

## Why it went unnoticed

The DEFAULT run never audits this instance. `root` defaults to `AUDITOR_ROOT` —
`cat-harness/`, where the script lives — so `folio-assistant`, the instance
declared at the repository root, is audited by nothing unless somebody passes
`--instance .`. That is the `dh4f` shape: not a wrong answer, an absent one.

## Why it is not fixed here

`repoRoot` is passed on to three consumers — `rootScripts`, `discoverPairs` and
`evaluatePairs` — so the fix has to decide what "the repository root" MEANS for
the root instance in each, which is a different subject from skill resolution.
Absorbing it into that change would widen the PR past what the failure needs.

## Done when

- `kg:audit --instance .` audits rather than throwing.
- The root-instance case is exercised by a test, not only by a manual run.
- `scripts/tests/resolution-across-needs.test.ts` drops its `ROOT_INSTANCE`
  exclusion, which names this bean as the reason it exists.
