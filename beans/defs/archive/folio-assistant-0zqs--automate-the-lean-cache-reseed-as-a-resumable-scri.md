---
# folio-assistant-0zqs
title: Automate the Lean cache reseed as a resumable script
status: completed
type: feature
priority: high
created_at: 2026-08-07T14:52:45Z
updated_at: 2026-08-07T14:56:22Z
---

Turn docs/guides/reseeding-the-lean-cache.md into scripts/reseed-lean-cache.sh: phased, resumable, safe-by-default (no production force-push without explicit promote), with the ordering traps enforced rather than documented.

## Summary of Changes

`scripts/reseed-lean-cache.sh` — phased, resumable, safe-by-default.

Enforces the two ordering traps instead of documenting them: removes an
incomplete extracted toolchain before elan (elan skips the download
otherwise) and runs `lake exe cache get` before `lake build` (upstream
Mathlib ships the traces, in minutes rather than hours).

Feature-branch safe, as asked:
- reports the current branch and never switches it;
- refuses on uncommitted TRACKED changes;
- detects a local `lake-cache/*` branch that would break
  `git checkout --orphan` inside the seed worktree, and offers to delete
  just the local ref;
- prunes stale worktrees from an interrupted run.

Safety: seeds to `<branch>-test`, verifies a restore from a CLEAN clone,
and asserts own-oleans > 0 and trace coverage >= 90% before allowing
`--promote`. Production is force-push-only and orphan branches have no
history, so promotion is opt-in and confirmed.

Bug found while testing: the `status` calls ran in whatever cwd the
script had, and `lake-cache.sh` derives its repo root from `git rev-parse`
there — so invoked from the platform checkout it would have resolved
folio-assistant as the content repo. Now runs from $REPO.

Verified: --help, arg validation (exit 2), dry-run end-to-end from a
FEATURE branch, single-phase selection, multi-package roster resolution
(qou and ugb), and the local-branch-collision guard.
