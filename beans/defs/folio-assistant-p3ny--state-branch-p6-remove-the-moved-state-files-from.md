---
# folio-assistant-p3ny
title: 'STATE BRANCH P6: remove the moved state files from main — ONLY on the owner''s explicit go'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T10:58:10Z
updated_at: 2026-10-04T07:23:15Z
parent: folio-assistant-fs43
blocked_by:
    - folio-assistant-h8ig
---

deletion-requires-confirmation. Not before every reader in P3 and gate in P4 is green on the branch.

## Done when
- [ ] owner's go recorded
- [ ] files removed; beans/README.md count-line churn (y7b3) gone

Proposal: cat-harness/docs/proposals/state-branch-2026-10-02.md

_2026-10-04T06:10:27Z_ — Claimed by claude/beans-off-main-9ofm — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Owner's go recorded 2026-10-04, and the two things that still gate it

Owner dispatch, 2026-10-04: *"Phase 6 (removing `beans/` from `main`) is pre-authorised"*, with the standing condition from the proposal — not before every reader and writer is green against the branch.

It did not land in PR #2052, for two reasons:

1. **The session's permission layer refused the removal** as irreversible local destruction, and the refusal covers reaching the same outcome another way. A pre-authorisation in a dispatch is not the permission system's consent, so the flip needs a human or a session that holds it.
2. **`claim-bean` still pushes to `main`** (measured on main@abbc21c90f34). After the cutover that writes `beans/defs/<id>.md` into a main that no longer tracks `beans/`, re-creating the directory — which `check:declared-dirs` then reports as `not-cut-over`: a red main caused by claiming a bean. PR #2042 fixes it and must merge first.

Everything else is ready: the branch is current and verified (`cat/cat-harness/beans` @ 67265200d0ff, subtree 05fbb6a90bc1, 1442 files = main's 1442), `state:seed --id beans --authoritative` performs the branch half, CI mounts the graph before any gate reads it, and the engine resolves its directory instead of composing it.

The exact five-step commit, the file counts on both sides, and the measurement that `.beans.yml` needs no change are in the bean note `beans/notes/folio-assistant-9ofm--2026-10-04--claude-beans-off-main-9ofm.md`.

## 2026-10-04, later: the blocker list is now exact

1. **The claim writer** — bean `h8ig`. #2042 landed a REFUSAL, not a writer, so after the cutover `beans:claim` returns `unknown` for every session, while AGENTS.md, `bean-coordination` and the session-start sweep all require a claim before durable work. It carries a design question that is not a port: `fell-back` means "the claim is on this branch only", and after the cutover the pull-request branch has no `beans/` to hold it.
2. **The permission to remove the files.** `git rm -r beans` was refused in the dispatched session as irreversible local destruction, and the refusal covers reaching the same outcome another way.

Everything else is ready and verified. `bun run state:seed --id beans --authoritative` is the branch half, and it is idempotent: a second run over an unchanged subgraph reports `current` and pushes nothing (fixed on PR #2052 after that module's own test caught it pushing a commit whose only content was a new manifest timestamp).

## Blocked on

- **waits on:** bean `h8ig` (`beans:claim` must write through the branch store — after the cutover claiming is impossible, not just unsafe), and separately a hand that holds permission to remove 1457 tracked files.
- **since:** 2026-10-04
- **expires:** 2026-10-18. If `h8ig` has not landed by then, the block is not the thing to re-check — the ARC's ordering is, because a Phase 6 that waits a fortnight on a Phase 3 row means the row was mis-phased, and the honest move is to say so on `fs43` rather than to extend this date again.
- **handoff:** everything else is ready and verified. The flip is five steps, written out in this bean's body and in the note `beans/notes/folio-assistant-9ofm--2026-10-04--claude-beans-off-main-9ofm.md`: declare `source: { kind: "branch", branch: "cat/cat-harness/beans", keyedBy: "tip" }`, `git rm -r beans`, add `/beans/` to `.gitignore`, `bun run state:seed --id beans --authoritative`, `bun run state:mount`, then the gates. The branch is current and verified at every refresh, so step 4 is cheap to re-run first. Do NOT reorder: the seed before the `git rm` leaves a window where neither copy is authoritative, and the `git rm` before the declaration leaves a checkout whose declaration says the files are here.
