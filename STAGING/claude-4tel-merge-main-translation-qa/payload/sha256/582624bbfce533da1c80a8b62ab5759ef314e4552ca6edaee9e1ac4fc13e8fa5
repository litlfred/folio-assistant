---
# folio-assistant-tqv4
title: 'CENSUS SCOPE: root-scan-census is instance-scoped, so scripts moved up to core are counted nowhere — and its headline family reads 0 of 0 while the only instance of the shape sits outside it'
status: completed
type: bug
priority: normal
created_at: 2026-09-30T10:28:50Z
updated_at: 2026-09-30T13:51:27Z
parent: folio-assistant-vke6
---

`root-scan-census` is INSTANCE-scoped — `census(resolve(INSTANCE_ROOT, "scripts"))`
at `cat-harness/scripts/root-scan-census.ts:231`, where `INSTANCE_ROOT` is
`cat-harness/`. No other instance runs an equivalent census. So every script the
instance-boundary work moves **up** into `folio-assistant-core/` leaves this
measurement and is counted **nowhere**.

## The count falls, and falling reads as improvement

Two tranches reported the same shape from inside `yj6r`, and reported it as a
loss rather than a win:

- `check-artifact-index.ts` moved: **68 -> 67** enumerating scripts.
- `check-voices.ts` moved: **66 -> 65**.

Twice is a property of moving anything up, not an accident of one file. Nothing
in the sidecar, the gate, or the census's own prose distinguishes *"one fewer
script has this shape"* from *"one more script is out of scope"*. A reader — or
the next agent diffing the sidecar — sees a smaller number and has no way to
tell which happened.

## The sharper half, measured today

The census's headline family is `seeded-at-root-not-git-aware` — its own summary
calls it *"the shape that actually costs something"*. On `main` at
`408f9982265` it reads:

> `0 of 0 such scans, 65 enumerating scripts in all.`

Running the exported `census()` against `folio-assistant-core/scripts` gives:

```
folio-assistant-core/scripts: enumerating=2  seeded=1  exposed=1
   folio-assistant-core/scripts/check-artifact-index.ts   seeded=true  git=false
   folio-assistant-core/scripts/check-voices.ts           seeded=false git=false
cat-harness/scripts:          enumerating=65 seeded=0  exposed=0
```

**The repository's only instance of the shape this census exists to find is in
the instance the census does not scan.** And it is not a syntactic false
positive — `check-artifact-index.ts:41,53` is

```ts
const ROOT = repoRootFor(join(import.meta.dir, ".."));
for (const entry of readdirSync(ROOT).sort()) {
```

a `readdirSync` seeded at a root constant, with no call into
`schemas/git-corpus.ts` and no `ls-files`. That is literally the dangerous
shape, not a near miss.

So the family does not read `0` because the shape was eliminated. It reads `0`
because its subject moved out of scope — and `0 of 0` is exactly what a clean
corpus looks like. That is the `dh4f` failure (a consumer scanning nothing and
reporting a clean run) arriving through a different door: here the directory is
real and the scan works, it is the *instance* that narrowed.

## Why this is not `p11x` and not `xd1g`

- `xd1g` (completed) asked **which** scans lack gitignore awareness. This asks
  whether the census that answers that question still covers the corpus.
- `p11x` is the same shape one axis over — a check whose scope no longer
  matches its subject — but over a different check. Ruling one does not rule
  this.
- `check:audit-coverage` asks which KINDS are audited, per declared graph kind.
  It cannot see this: `scripts/` is not a declared graph, and the census is not
  a `kg-audit` criterion.

## Done when

The census's coverage is a **stated property** rather than an accident of which
instance it happens to live in. At least:

1. It is decided and written down whether the census is per-instance (each
   instance runs its own, sidecars side by side) or repository-wide (one census
   over every declared instance's `scripts/`).
2. Whichever is chosen, `folio-assistant-core/scripts/` is covered, and
   `check-artifact-index.ts` appears in a `seeded-at-root-not-git-aware` family
   somewhere — or is fixed, and the family is empty for the right reason.
3. A **denominator that cannot silently shrink**: the census prints, or the
   sidecar carries, which instances it scanned, so a drop in `enumerating-scripts`
   can be told from a drop in scope. Three-state discipline — "not scanned here"
   is neither a finding nor a pass.

## What this bean deliberately does NOT decide

Whether `check-artifact-index.ts` should be made git-aware. The census reports
and never fails (owner's ruling, 2026-09-27); this bean is about the
measurement losing its subject, not about the subject. Fixing the script while
the census still cannot see it would remove the evidence and leave the gap.

_2026-09-30T13:50:29Z_ — Claimed by claude/magical-archimedes-4qkfxp-tqv4 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Summary of Changes

Done 2026-09-30, branch `claude/magical-archimedes-4qkfxp-tqv4`.

1. **Decided: repository-wide.** One census over every declared instance's `scripts/` (`censusRepository` over `instanceRootsIn`), written down in the module docblock. Not per-instance, because a per-instance census needs each instance to remember to run one — the same counted-nowhere gap one step later.
2. **folio-assistant-core/scripts/ is covered**, and `check-artifact-index.ts` is now the headline family's one entry: **1 of 1** seeded-at-root-not-git-aware, where main read **0 of 0**. It is not fixed here, as the bean asked.
3. **The denominator cannot shrink silently**: a new `scope` family lists every declared instance as `scanned` (with its count) or `no-scripts-dir` — neither finding nor pass — and the console prints the same line. Measured: 17 declared instances, 8 with a scripts/ dir; cat-harness 66, folio-assistant-core 2, who-iris 1; 69 enumerating in all, 12 ask git.

Tests: three new cases in `root-scan-census.test.ts` — a script in a second instance is counted, the sidecar carries the scope, and folio-assistant-core is in scope over this repository.
