---
# folio-assistant-ip4l
$schema: bean/1.0.0
title: 'Memory: Agent-built fa previews verified by a full CI rebuild (Q-SPD-9 B, Q-SPD-9b A): issue fa#2881, PRs tools#1290 + fa#2885, open card Q-ABP-1'
status: completed
type: task
priority: low
created_at: 2026-11-01T16:43:37Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `agent-built-previews.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Agent-built fa previews verified by a full CI rebuild (Q-SPD-9 B, Q-SPD-9b A): issue fa#2881, PRs tools#1290 + fa#2885, open card Q-ABP-1

Thread "Build previews from agent sessions" (cmsg_017WNUkNK8kdDziPK58Pv6G9RNweBbbGoWz8W8n8kXv53j), sibling of the CI speed thread (…LZubkHzAS3oJzST6zV8aZE), started 2026-11-01 16:30Z.

Owner picks (2026-11-01): Q-SPD-9 B = agent-built PREVIEWS only (main/release stay CI-only); Q-SPD-9b A = full CI recheck, not a random sample.

Design (built 2026-11-01):
- tools#1290 (branch claude/agent-built-previews): `scripts/preview-record.ts` write/match/compare. Record `_build-record.json` = git tree (HEAD^{tree}) + sha256 per file (HTML normalised as staging-share does) + digest. Build-fact files excluded by a FIXED list in code. compare exit 0 same, 1 differs, 3 other tree (stale). stage-local writes it on every agent preview.
- fa#2885 (same branch name): conflict-gate defers `stage` when gh-pages record is builder=agent with the PR merge commit's tree → pending status `preview/agent-build`. `preview-verify-sweep.yml` (cron 15 min, one Feature Staging dispatch at a time) dispatches `verify_pr`; verify replaces + red status on any difference. Guarded on preview-record.ts, inert until tools re-pin.
- Q-ABP-1 A (owner 16:48Z): replay the workflow's own steps locally: tools `scripts/stage-workflow-local.ts` (on tools#1290). Run BEFORE pushing the branch commit.
- Trial 2026-11-01: needs the IG repos (smart-base, smart-trust, smart-trust-phw, smart-immunizations) attached for API releases; derive+IG render OK (~15 min); Jekyll blocked: codeload.github.com denied by the built-in env network policy (remote theme). Q-ABP-2 (A merge both / B full trial first / C hold) posted 17:4xZ.
- Follow-ups: merge-guard reading preview/agent-build; feature-staging.bpmn defer/verify branch.
Related: folio-assistant-xq9j folio-assistant-ik4a folio-assistant-on9m.
