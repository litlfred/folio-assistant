---
# note on folio-assistant-tv20 from claude/ci-skip-main-only-reruns
$schema: folio-bean-note/v1
bean: folio-assistant-tv20
branch: "claude/ci-skip-main-only-reruns"
created: "2026-11-05"
---
## Why not a straight publish-pages reuse; QA-copy reuse needs one runner measurement

Read on main b3bc4d2. Session https://claude.ai/code/session_01VQDpPeQPJxidbiuwAuo6zE.

**A straight reuse of CQG's `publish-pages` artifact is not the same build.** Differences:
- `stage` sets `CAT_BUILD_TYPE=preview`; CQG's `publish-pages` sets no build type.
- `stage` runs the writer skip (`CAT_WRITER_SKIP`, bean fwtz) and `smart:pages:publish`; CQG runs every writer and `smart:pages`.
- Timing: both jobs start on the same `pull_request` event. CQG's `publish-pages` is ready only after `qa-working-copy` (~8 min) plus its own build, while `stage` reaches `derive:publish` ~5 min in. Waiting idle costs about what building costs.

**The part worth taking is `uml:overview`'s own QA working copy:** 511 of the step's 817 s on job 124708101507. CQG's `qa-working-copy` artifact is that copy for the same merge commit (`github.sha`), with its stamp. `requireCurrentWorkingCopy` trusts it only when the stamp's tracked-tree digest matches. That digest also covers untracked files that are not ignored, so it is safe by construction.

**Open question, needs one runner experiment:** does the tree `stage` has at `derive:publish` (after `ig-index:build` and `smart:pages:publish`, with the writer-cone restore) give the same digest as CQG's producer (after `ig-index:build` and `smart:pages`)? If `smart:pages:publish` writes extra untracked files that are not ignored, the restored copy reads stale and nothing is saved.

**Proposed experiment:**
1. In `stage`, before `derive:publish`, restore CQG's copy for the same tree via `qa-copy-reuse.sh`, generalised to take `PR_HEAD` and a bounded wait for the producer job (e.g. ≤6 min).
2. Print `qa:working-copy --status`.
3. Keep the restore only if it reads `current` on a real PR run.
