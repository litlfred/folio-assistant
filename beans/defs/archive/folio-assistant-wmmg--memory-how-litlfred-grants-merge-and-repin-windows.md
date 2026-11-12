---
# folio-assistant-wmmg
$schema: bean/1.0.0
title: 'Memory: How litlfred grants "merge and repin" windows and how Claude records consent for repins'
status: completed
type: task
priority: low
created_at: 2026-10-31T17:07:51Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `merge-repin-windows.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: How litlfred grants "merge and repin" windows and how Claude records consent for repins


litlfred grants time-boxed "merge and repin" windows, usually "+3hrs". Inside a window, Claude may merge its own PRs across litlfred's harness repos (fhir-harness, cat-harness, cat-harness-tools, folio-assistant-core, who-iris, dth-*, smart-pcmt fork, ...), re-pin layers, and republish. This never covers WHO repos.
**Why:** many parallel sessions drain PR queues; a window saves a separate ask for each PR.
**How to apply:**
- Note the window's end in UTC.
- For each re-pin, cite the owner's message (date, time and quote) as the `trust.consent.evidence` in index.config.json, then regenerate the lock with `remote-mount.ts`.
- Outside a window, ask on a card.
- A window relayed by the coordinator is sometimes refused by the safety check. Then the owner's own tap is needed. See folio-assistant-ubrt.
- Standing rule (2026-10-29 07:20Z): "Merge all ready and then deal with aftermath" (litlfred repos only).

Gotchas:
- `gh pr view` and GraphQL are blocked: use `gh api repos/...` REST. Draft↔ready goes through `/pulls/N/ccr/ready_for_review`.
- Actions log blobs are blocked: use the GitHub MCP `get_job_logs`.
- "Rerun failed jobs" reuses the old shard results, so use a full workflow re-run.
- who-iris CI runs on its own pins, so a gate fix in a lower layer needs a who-iris re-pin of core, cat-harness and cat-harness-tools together (skew causes other new failures).

Recent windows (earlier ones dropped; windows are FUNCTIONAL only, content needs explicit OK):
- 2026-11-01 15:23Z card Q-DRAIN-10 A + "+3 hrs functional merges" (cmsg_017WNUkNK8kdDziPK58Pv6G92nTpZHyM4RZ6LQNsxyLjqt), to 18:23Z. Note: the 12:36Z merge attempt citing the 10:53Z window was refused by the safety check; a tap in this thread worked.
- 2026-11-01 20:40:15Z "merge all green and ready (not content) + 6hrs" (cmsg_017WNUkNK8kdDziPK58Pv6G9NdqkvnprnzAj2kus7uVRD1); 22:34:09Z "window +12hrs." (cmsg_017WNUkNK8kdDziPK58Pv6G9PErv8fhBqeocyxkaTZQkuL): to 2026-11-02 14:40Z, non-content only.
- Pattern 2026-10-23 to 10-30: the owner re-extends "+3hrs" about every 3 hours, by card or via the coordinator.
- Draft PRs run only the fast tier and still show "(no new failures)" green: not real. Mark ready FIRST, then update-branch (or push), so the full tier runs; update-branch then ready races and the ready run gets cancelled. Never push an empty commit to kick CI (a helper did on 2026-11-01; owner told).
- 2026-11-01 16:08:42Z "merge +repin window open +3hrs for approved work areas" (cmsg_017WNUkNK8kdDziPK58Pv6G9LR1zeenF1AJ9hyV9GdA5TR), to 19:08Z: functional + in-scope content (smart-* except smart-ra; dth-* meaning-neutral extraction fixes); green checks.
- 2026-11-01 17:27:04Z "+3hrs" (cmsg_017WNUkNK8kdDziPK58Pv6G9NvMGGKmpGA95ekCsPZLSdn, via coordinator), to 20:27Z, same terms.
- 2026-11-01 18:45:50Z card tap Q-FMR-2 "A. Yes, merge each on green" (thread Fix red checks on fa main): cat-harness#925, #931, smart-trust#120 until 20:27Z. The relayed 17:27Z window was refused by the safety check again; the tap worked.
- 2026-11-01 19:11:07Z card tap Q-FMR-3 A: merge cat-harness-tools#1319 (pdf.js 6.5.438) on green.
- 2026-11-01 19:30:13Z card tap Q-FMR-4 A: core#516 (glossary-pot ignores #: lines) merge on green; smart-trust#120 closed.
- 2026-11-01 19:36:24Z Q-TRAIN-10 A: window for fa#2890 (re-pin train) + core#504 extended to 21:30Z (cmsg_017WNUkNK8kdDziPK58Pv6G939SrzfXqUWoQa4QyFcnUf6).
- 19:36:32Z: user wrote "+6hr window" (cmsg_017WNUkNK8kdDziPK58Pv6G9QALW4qBbwo6x1G62v5wc87). The general window now runs to 2026-11-02 01:36Z, same scope.
- 2026-11-01 19:36:32Z "+6hr window" (cmsg_017WNUkNK8kdDziPK58Pv6G9QALW4qBbwo6x1G62v5wc87), to 2026-11-02 01:36Z. Coordinator 20:21Z: updateFromGitHub is broken; point to copy page https://claude.ai/artifact/MXNQcLMzLYqq5us5x6phGd with the new build id instead.
- 20:25Z user: 'if not green, but same red as before, then can merge.' + 'existing shoudl be fixed by an agent' (cmsg_017WNUkNK8kdDziPK58Pv6G9TabmbKnYckp3oFXLWwUGbt, …MCgkZ25cXyGQf8k5o4KHsV). Thread …BbaFk6c5F5NCsTkzWpJ1eZ owns the main-reds inventory across all repos.
- 20:40Z user: 'merge all green and ready (not content) + 6hrs' -> window to 2026-11-02 02:40Z (cmsg_017WNUkNK8kdDziPK58Pv6G9NdqkvnprnzAj2kus7uVRD1).
- 2026-11-01 21:34Z card tap Q-FMR-5 A: merge fhir-harness#266 (phw IG build). 20:40Z relayed '+6hrs' window to 02:40Z still refused by the safety check; tap worked.
- 2026-11-01 21:41:59Z card tap Q-FMR-6 A: merge cat-harness#936 on green.
- 22:34Z user 'window +12hrs.' (cmsg_017WNUkNK8kdDziPK58Pv6G9PErv8fhBqeocyxkaTZQkuL) -> to 2026-11-02 14:40Z, same rules.
- 2026-11-11 16:05:30Z user in MM thread: "+12ht repin+merge window" (cmsg_017WNUkNK8kdDziPK58Pv6G9A4gqquu7bha27LfmNqarmL) -> window NOW to 2026-11-12 04:05Z. Non-content merges + re-pins without a card; content still needs a card. Full-tier + exact-main freshness rules still apply. Never WHO repos.
