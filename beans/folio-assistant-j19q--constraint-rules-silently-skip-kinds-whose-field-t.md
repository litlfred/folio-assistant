---
# folio-assistant-j19q
title: Constraint rules silently skip kinds whose field they check is universal
status: completed
type: bug
priority: normal
created_at: 2026-08-08T15:36:24Z
updated_at: 2026-08-08T15:42:47Z
---

validate.ts:510 does 'if (!rule.appliesTo.includes(block.kind)) continue' — a kind absent from a rule's appliesTo is silently unvalidated.

Enumerated all 10 rules in schemas/constraints.ts against BLOCK_KINDS (15). Five are legitimately kind-specific (lean-file-exists = definition, simulator-html-exists = simulator, remark-interprets/interprets-resolve = remark, provable-lean-warning = the 4 provable kinds). uses-resolve is already full. The other four are narrower than the field they check:

- cites-resolve applies to 9 kinds, but 'cites' is a BlockBase field — every kind can carry it. An algorithm/proof/simulator/equation/diagram/table block whose cites[] names a key absent from references.ts is never checked.
- simulator-ref-resolve applies to 8, but 'simulator' is also BlockBase.
- md-crossref-resolve applies to 10; its check already returns null when there is no md content, so the narrowing only creates blind spots. A proof block's .md with a broken [text](#label) is unchecked.
- md-exists applies to 10 while its description says 'Every block must have a companion .md file'. NOT changing this one: whether equation/diagram/table need an .md is an editorial policy question, not obviously drift, and qou has ~445 table blocks. Flagged only.

All three widened rules already self-guard on the absent field, so widening is behaviour-preserving for blocks without it.

Blocked on a small refactor: constraints.ts cannot import BLOCK_KINDS from types.ts because types.ts imports values from constraints.ts and appliesTo is evaluated at module init — the cycle would leave it undefined. Moving BLOCK_KINDS to a leaf module and re-exporting from types.ts.


## Summary of Changes

Two defects, one nested inside the other.

### 1. `cites-resolve` could never fire at all

The narrowing was the smaller problem. `validate.ts:499` built its
`ConstraintContext` **without `allRefIds`**, and the rule opens with
`if (… || !ctx.allRefIds) return null` — so the only rule validating a block's
`cites[]` against the bibliography returned null for every block of every kind,
always. `bib-qa` does not cover it either: it scans `.tex` and `.md` for
`\cite{}` and bracket forms, never the `.ts` manifest field.

`validate.ts` now supplies `allRefIds` from the reference registry. A folio with
no bibliography is legitimate, so an absent registry is not an error — but it
must not read as "citations checked" either, so the validator emits one `info`
line saying `cites-resolve` did not run. `hasErrors` counts only `error`, so
this reports without failing anyone. Added `referenceRegistryConfigured()` to
the registry, since `getReferenceRegistry()` throws and a caller that may
legitimately proceed without references needs to ask rather than catch.

### 2. Three rules were narrower than the field they check

`cites` and `simulator` are **BlockBase** fields — every kind can carry one —
and `md-crossref-resolve` already guards on `ctx.mdContent`. All three
self-guard when the field is absent, so widening to `...BLOCK_KINDS` is
behaviour-preserving for blocks without it and gap-closing for blocks with it.

`md-exists` was deliberately NOT changed. Its description says "every block"
while it applies to 10 of 15, but whether an `equation`/`diagram`/`table`
block needs a companion `.md` is an editorial policy question, and qou carries
~445 table blocks. Left as found, recorded in the test's `KIND_SPECIFIC` table
with that reason.

### The refactor this needed

`constraints.ts` could not import `BLOCK_KINDS` from `types.ts`: `types.ts`
imports schemas from `constraints.ts` at module scope, and `appliesTo` arrays
are built during module init — exactly when a cycle leaves the import
undefined. That is *why* those lists were hand-written. `BLOCK_KINDS`,
`BlockKind` and `BLOCK_KIND_ALT` moved to the leaf module
`schemas/block-kinds.ts`, re-exported from `types.ts` so no consumer changed.
The compile-time exhaustiveness proof stays in `types.ts` (it needs the union);
verified it still bites across the file boundary by deleting `"table"` from the
list and watching `tsc` fail at `types.ts(1007)`.

### Correction to this bean's own numbers

It said 10 rules. There are **11** — my enumeration regex required `id:` within
400 chars of `appliesTo` and missed `lean-stub-conjecture-kind-check`, which is
the same incomplete-scan-reporting-as-complete defect being fixed. The new test
found it, which is what the test is for. That rule is genuinely provable-only
and is recorded as such.

9 tests. The durable part is the forcing function: every rule must be universal
or listed in `KIND_SPECIFIC` with a stated reason, so a 16th block kind fails
the suite rather than quietly narrowing what gets validated.
