---
# folio-assistant-c4t7
$schema: bean/1.0.0
title: 'Memory: translation:block-qa judged cat-harness docs in content repos'' pin PRs; fix cat-harness-tools#1685 (issue #1684) scopes it per gate-own ruling'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:33:55Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `block-qa-own-only-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: translation:block-qa judged cat-harness docs in content repos' pin PRs; fix cat-harness-tools#1685 (issue #1684) scopes it per gate-own ruling


2026-11-08 thread cmsg_017WNUkNK8kdDziPK58Pv6G9XYLhKBAsPW4kvi2qWP3Y74.

- smart-immunizations#118 (pin wave 4) failed only on `cat-harness-tools:translation:block-qa:check`: 10 translation-coverage findings in CAT-HARNESS's docs/concepts/architecture.* and docs/index.* (INSTANCE_ROOT = HARNESS_ROOT), new because the PR bumps the cat-harness pin.
- Not a new policy: owner ruling 2026-11-05 "Move the checks" (cat-harness-tools scripts/lib/gate-own.ts, env CAT_GATE_OWN_INSTANCES / CAT_GATE_OWN_PATHS set by run-gates.py). block-qa just didn't honour it.
- Fix: cat-harness-tools#1685 (branch claude/block-qa-own-only, aa32b48), `notOwnLine()` in pipeline/translation-block-qa.ts. Opened as draft; marking ready was refused by auto-mode classifier -> needs user/merge manager.
- After merge: #118 must re-pin cat-harness-tools to the merge commit to pick it up (its gates use its own lock, "index: the caller").
- Local test setup: sibling clones /home/user/{cat-harness,bootstrap-tools} + bun install in each, revert bun.lock.
- 08:32Z #1685 MERGED 3c94d73. #118 pins tools 9a4ccd9 (lock + 4 workflow `uses:`); re-pin handed to pin wave 4 thread …PLg8CWt5r1594GvVwsttUB (owns branch). Local seed from this thread failed (mount-edits / workspace resolution); use that thread's setup. #118 also waits on main-green-first (WHO template outage).
