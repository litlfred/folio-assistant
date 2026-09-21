---
# folio-assistant-jijc
title: DECLARATION_FILENAME exists and 21 non-test call sites bypass it, so the REPLACE ruling is a 121-file sweep instead of one constant
status: in-progress
type: bug
created_at: 2026-09-21T07:14:08Z
updated_at: 2026-09-21T07:14:08Z
parent: folio-assistant-vke6
---


Opened 2026-09-21 by session_01AYHimvYMmf8h8e9fFN6dW5, as the separable half of
the owner's REPLACE ruling on `b5f0` — the half that is **correct under either
filename**, so it cannot be wasted by a later change of mind and needs no
further decision.

## Measured before starting, 2026-09-21

| | |
|---|---|
| declarations on disk | 12 (a 13th, `cat-harness/docs/_data/harness.json`, is generated Jekyll data — **not** a declaration) |
| TypeScript files naming the string | 121 (357 occurrences) |
| **non-test bypasses** | **20** across 10 files — 18 inside `cat-harness/`, 2 outside it |
| test-fixture occurrences | ~100 |
| workflow `.yml` files | 2 |

Two independent methods agreed on 20: a grep over double-quoted literals, and
the checker written for this bean.

## The check came FIRST, and that was the point

The substitution is mechanical and therefore not the interesting half. Without
a gate it regresses the first time anyone types the filename again — so
`check:declaration-filename` was written, **watched go red on all 20**, and only
then were they fixed.

## The rule, and the four classes it refuses to fail on

> A quoted string literal whose **whole value** is the declaration filename, in
> a non-test `.ts` file, outside the constant's own definition.

Whole-value is what keeps it free of judgement: a path is built by
`join(root, "harness.json")`, where the filename is the entire string. Prose
mentioning the file is a sentence, never a whole-string literal.

| counted, not failed | why |
|---|---|
| prose in messages and doc comments | a rename REWORDS these. Failing them would demand error text be assembled from constants, which nothing asks for |
| test fixtures | **a judgement, not a measurement** — see below |
| template literals building a path | 0 on this corpus; implemented and proven against a planted case anyway |
| call sites outside `cat-harness/` | 2, and fixing them needs a boundary decision — see below |

## Two things the work turned up that are worth more than the refactor

**1. `docs/_data/harness.json` is a DIFFERENT FILE.** Found because the first
draft of the template rule accepted a bare `/` before the filename and reported
`` `docs/_data/harness.json is stale.` `` as construction. It is Jekyll data,
not an instance declaration, and **it must not be renamed** under the REPLACE
ruling. A hand-run sweep over the basename would take it, which is exactly how
a rename breaks a site build. The rule narrowed to interpolation-only and the
class went back to zero; the trap is now a named test.

**2. `instanceConfigFilename(name)` ALREADY EXISTS** in
`schemas/harness-config.ts`, returning `` `${name}.config.json` `` — the exact
REPLACE target — alongside `resolveHarnessConfigPath()` and a
`check:instance-config` gate. So REPLACE is not starting from nothing: the
naming function, the resolver and a gate are built. `check-undeclared-files.ts`
now imports **both** `DECLARATION_FILENAME` and `instanceConfigFilename` — the
before and after of the ruling, side by side in one import.

## The two classes left open, deliberately

**Cross-instance (2 sites, `folio-assistant-core/schemas/library-ref.ts`).**
`folio-assistant-core` imports **nothing** from `cat-harness` today. Using the
constant there would create this repository's first cross-instance code
dependency; giving core its own copy would make two constants, which is this
bean's own defect one layer up. That is `vke6`'s decision, not a refactor's.
Counted **with their locations**, never silently excluded — a count alone
cannot be acted on, and excluding them would be the `dh4f` shape.

**Test fixtures (~100).** A fixture writing `join(root, "harness.json")` is
constructing the file the code under test looks for. Route it through the
constant and the test passes **vacuously** after a rename — the fixture moves
with the code and nobody learns the contract changed. Pinning is defensible;
so is ~100 hand-edits being unacceptable. This is a judgement and it is left
as one rather than decided silently by a checker.

## Verification

Gate red on 20 → green. `bun run typecheck` clean. 11 tests, of which
**5 go red when both halves of the rule are stubbed to `false` and 5 stay
green** — the five that stay green are the false-positive guards, one per
class above. The ratio was RUN, not estimated: an earlier draft of the test
header said "three".

## Done when

- [x] `check:declaration-filename` reports a non-test call site that builds the
      declaration path from a literal, with prose, fixtures, template
      construction and cross-instance sites each classified rather than lumped
- [x] The 18 bypasses inside `cat-harness/` are routed through the constant
- [ ] Wired into `code-quality-gates.yml` so it runs in CI
- [ ] **Owner or `vke6`:** do the 2 cross-instance sites get the constant via a
      declared dependency, or does core keep its own literal until the split?
- [ ] **Judgement:** are the ~100 test fixtures pinned deliberately, or
      migrated? Recorded here so a later reader knows the silence is a decision
- [ ] The 2 workflow `.yml` files are handled by whatever does the rename;
      they cannot import a constant and this check has no opinion on them
