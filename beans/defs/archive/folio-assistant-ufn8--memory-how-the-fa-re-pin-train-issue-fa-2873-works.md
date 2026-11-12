---
# folio-assistant-ufn8
$schema: bean/1.0.0
title: 'Memory: How the fa re-pin train (issue fa#2873) works, its traps, and its state as of 2026-11-02 16:30Z (train #2921)'
status: completed
type: task
priority: low
created_at: 2026-11-02T14:55:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `repin-train-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: How the fa re-pin train (issue fa#2873) works, its traps, and its state as of 2026-11-02 16:30Z (train #2921)


Thread "Run re-pins as a 2-hour train" (cmsg_017WNUkNK8kdDziPK58Pv6G9MmDK4fGPz89Zs2mtVYEY36).

How it works
- repin-train.yml (cron 17 */2) moves only pins with `trust.standing` (Q-TRAIN-1 A: all except smart-base) to main, opens ONE frozen PR on repin-train/<stamp>. A train with new reds is REPLACED at the next cron and hand pins are LOST: re-apply them on the new branch (copy refs+consent from the old branch's index.config.json).
- Verdict compares check names with fa main; merge on no new reds (owner "merge when ready"). Window to 2026-11-02 14:40Z, non-content.
- Hand fix: worktree /tmp/train-wt; python json edit (ensure_ascii=False, indent 2, trailing newline; set source.remote.ref AND trust.consent.ref); mount-from-lock; remote-mount --fresh ("unmounted": []); mount-from-lock --check; `git checkout -- .github/workflows`; commit; push. Fetch with explicit refspec (+refs/heads/X:refs/remotes/origin/X) or origin/X stays stale.
- Local check: `bun run cat-harness-tools/pipeline/gen-library-jsonld.ts --check`.
- smart-trust overrides must list `references` until a train merges.
- Train cannot commit workflows (Q-PIN-6 C); workflow fixes need the owner.

State 16:30Z
- Train is now #2921 (repin-train/20261102-1625; #2917 -> #2920 -> #2921). Hand pins: core 242825a, sci 250c78e, smart-base 5ab48e3, who-iris 40d52ba, cat-harness 9496523, fhir-harness 594aee1, smart-trust ab38cbc, smart-trust-phw 4e78be1, smart-immunizations 6895586 (their mains leave .pot / library .jsonld stale). tools = train's 185fedd (#1407 merged).
- #2920's only new red was stage (owner's Q-SLASH-8 workflow edit, still not made). Shards 2/4, 3/4 main reds. Bean-parents red (65aj) fixed by log watcher 15:23Z.
- Each cron (17 */2) replaces the train until the workflow edit lands: copy pins from the previous train head (python per-instance copy of index.config entries).
- TRAP: pushing to a replaced train's branch RECREATES it (happened 14:3xZ with repin-train/20261102-1229 @ e01e8f9; deletion was blocked, user to delete). Check the PR is still open before pushing.
- TRAP: `until ! pgrep -f "remote-mount.ts --fresh"` matches itself and never ends.
- On merge notify: slash thread (cmsg_017WNUkNK8kdDziPK58Pv6G95HvJ9m7xBV6qWhqn6M2rVj), dth-hrh L2, re-pin prep (session_01Qmmkt5oYY58dMFeUfYD8ee), tools#1299, meta-merge, dth-sfp, 2015 guide, cascade, security, S9, CI, dth-sc, smart-ra panel; then fhir-harness#269.

Update 2026-11-07: train fa#2921 merged 2026-11-02 23:28Z with core#624 and cat-harness#996 (glossary regen). Traps learned: a new skill naming 2+ higher instances fails check-reference-direction (reword); new BPMN lanes need bpmn:documentation (check:lane-documentation); a fresh remote-mount needs CAT_HARNESS_ROOT when cat-harness is removed. Open for the next train (#3024 open as of 11-07): who-iris library/9789241549226-eng needs `gen-library-jsonld --entry library/9789241549226-eng` (59 functional-requirement blocks become smart-base:FunctionalRequirement).
