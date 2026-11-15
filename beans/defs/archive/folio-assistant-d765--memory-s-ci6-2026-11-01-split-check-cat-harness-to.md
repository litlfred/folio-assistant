---
# folio-assistant-d765
$schema: bean/1.0.0
title: 'Memory: S-CI6 (2026-11-01): split check:cat-harness-tools-standalone into 4 parts and stop skill:register re-runs in gate shards; tools#1233'
status: completed
type: task
priority: low
created_at: 2026-11-01T08:56:04Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `split-slow-gates-s-ci6.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: S-CI6 (2026-11-01): split check:cat-harness-tools-standalone into 4 parts and stop skill:register re-runs in gate shards; tools#1233


Thread "Split the two slowest PR gates" (cmsg_017WNUkNK8kdDziPK58Pv6G9YKocrWcEHSzCQA1cNPtCfN), sibling S-CI6 of "Make the cone deploy safe to switch on". Follows folio-assistant-eahf and folio-assistant-kzm3.

Measured (core run 41287467368): standalone 510 s alone, red on core main (so it never decides a core PR); uml:overview:check 330-490 s, mostly the QA working copy (qa:refresh) whose skill:register re-ran 9 checks. The gate shards did NOT set CAT_SKILL_REGISTER_VERIFIED_BY_GATES (only the derive:publish step did).

Fix: cat-harness-tools#1233 (issue #1232, branch claude/split-slow-pr-gates):
- check-standalone.ts --part i/n -> bun test --shard=i/n; run-gates.py SPLIT_GATES gives `<name>#i/4` parts (alone, timing/4). Old pins ignore --part (run whole per part).
- run-gates.py setdefault CAT_SKILL_REGISTER_VERIFIED_BY_GATES from the side's gate set.
- Open point Q-CI6-1: per-part rule for unnamed errors is max(0, baseline unnamed) (baseline unnamed is -17 today).
tools#1233 MERGED 2026-11-01 11:39Z (2573f34), window from user's 10:53Z "+3 hrs". Follow-up tools#1269: split only when the side's mounted check-standalone.ts has --part (the gate runs the MOUNTED tools from the index lock, not the CI pin). tools#1269 MERGED 12:05Z (f35a491). core#492 re-pin MERGED 12:30Z (6f23b29). On core#492's run the standalone gate still ran whole (516 s) because the mounted tools predate --part. Parts only take effect once fa's lock pins tools >= 2573f34. Local test setup: bun install with @litlfred deps stripped, sibling clones symlinked into node_modules/@litlfred, run bun test from /tmp/bt (no bunfig preload).
