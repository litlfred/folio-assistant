---
# folio-assistant-fsl7
title: Repoint remaining hand-rolled block scanners at the module loader
status: todo
type: task
created_at: 2026-08-08T13:25:41Z
updated_at: 2026-08-08T15:55:00Z
---

Follow-up to jwd9, which replaced the source-text scan with module imports in conjectural-propagation-audit and conditional-class-banner-audit and added write-verification to prune-transitive-deps.

Still scanning source text:

- qa-checkers-extended.ts strips uses/cites from .ts text to decide whether an LP hint refers to this block or a downstream one. It is a SYNCHRONOUS checker, so it cannot await an import; repointing needs either a sync loader or a restructure of that criterion to inspect named fields instead of doing text surgery on everything-except-three-fields.
- readBlockManifest in qa-utils.ts is regex-based but builds its kind alternation from BLOCK_KINDS, so it cannot drift. It is the sync path walkBlocks depends on. Fine as is unless a sync loader appears.

Not urgent. Filed so the remaining scanners are known rather than rediscovered.

## 2026-08-08 — the first bullet's *bug* is fixed; the repoint itself is not

Bullet 1 said `qa-checkers-extended.ts` "strips uses/cites from .ts text to
decide whether an LP hint refers to this block or a downstream one", and that
repointing needs a sync loader or a restructure. Looking at it turned up a live
defect underneath, worth separating from the refactor:

**The strip list was three fields; the schema has nine.** `compute-lp-dual-present`
stripped `uses`, `cites` and `interprets`, then grepped everything else. But
`examples`, `proofs`, `defines`, `requires`, `mathlibLinks` and `blocks` are
reference fields too — they hold labels and paths pointing at OTHER blocks — and
an LP token in any of them read as evidence that THIS block computes LP duals.
Demonstrated with fixtures: `examples`, `proofs` and `defines` each produced a
spurious `fail` before the change.

Fixed by making the list complete and naming it: `REFERENCE_ARRAY_FIELDS` /
`REFERENCE_SCALAR_FIELDS` + `stripReferenceFields`, sited next to the criterion
with a note that adding a reference field to the schema means adding it here.
`scripts/tests/qa-checkers-lp-dual.test.ts` pins both directions — the criterion
still fires on a real LP solver whose witness lacks its dual certificate, and
stays quiet for a token in each of the six reference fields.

Verified inert on real content: the criterion was run over all 3523 blocks of
the `qou` folio before and after — identical output, zero diff. (All pass there
today, so the corpus alone is a weak signal; the fixtures are what carry the
evidence, and three of them failed before the change.)

### What is still open here, and why it is a decision rather than a task

The mechanism is still text surgery on `.ts` source. Two ways forward, and they
are not equivalent:

- **A true allowlist** — read `label`, `title`, `tags`, `script`, `witness`
  instead of "everything except the reference fields". Cleaner, and immune to a
  new reference field being added. But it NARROWS the gate: a block whose only
  LP token lives in an `authorNotes` body would stop being checked. That is a
  behaviour change with a real miss mode, so it wants a deliberate call rather
  than being slipped in under a refactor.
- **A sync loader**, which bullet 1 already names. Still absent.

Until one of those, the complete denylist is the honest middle: same behaviour
as before except for the bug, and the failure mode is now "someone added a
schema field and forgot this list", which the comment addresses.

Bullet 2 (`readBlockManifest`) is untouched and still fine as filed.

Leaving this bean `todo` — its actual subject, the repointing, is undone.
