---
# folio-assistant-qm9d
title: Make the 11 monorepo-only cat-harness tests standalone-safe; baseline 427 -> 416
status: in-progress
type: task
created_at: 2026-10-05T06:42:50Z
updated_at: 2026-10-05T06:42:50Z
parent: folio-assistant-iirv
---

Follow-up of `folio-assistant-ho66` (the standalone check).

Owner ruling, 2026-10-05, relayed by the merge manager: "1 + dispatch 3".
- (1): #2148 baselined 11 monorepo-only standalone failures, so main could go green.
- (3): the ho66 owner makes those tests standalone-safe and shrinks the baseline back.

Claimed by session_01BccmnVFbtRpKxM39kyVw9q, on branch claude/friendly-bell-xm9l1q.

## Approach
- **3 tests rewritten** to use cat-harness's own witnesses, or git's view of the checkout:
  - instance-roots-worktrees, "THIS checkout"
  - kg-export DMN ×2
  - root-index
- **7 skipped visibly outside the aggregate**, with `test.skipIf(!inAggregate())`. The helper, `cat-harness/test/support/checkout.ts`, is derived from git and the declarations.
  - gen-slice-sqlite ×3
  - gen-subgraph-jsonld, overlaid tree
  - process-index
  - kg-audit-root-instance, checkoutRootFor
  - the payload orphan audit
- **gen-subgraph-jsonld's payload test is split.** The sha256/sidecar half runs standalone. The orphan audit of the committed tree is aggregate-only (bean vj2p).

## Done when
- [ ] standalone-baseline.json is back to 416, with these 11 gone
- [ ] every changed file has 0 fails in the monorepo, and 0 fails among the 11 standalone
- [ ] CI is green and the PR is signed
