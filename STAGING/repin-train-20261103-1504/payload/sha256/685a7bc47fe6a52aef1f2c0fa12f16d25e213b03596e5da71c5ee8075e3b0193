---
# folio-assistant-i15r
$schema: bean/1.0.0
title: 'merge-main ran the PR branch''s scripts while holding the bot token (held B-H1)'
status: completed
type: bug
priority: high
created_at: 2026-11-01T21:00:00Z
updated_at: 2026-11-01T21:00:00Z
parent: folio-assistant-sb31
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
---

Held finding of the 2026-10-31 security review, filed after its fix merged (owner Q-SEC-1 A, 2026-11-01 20:57Z: held findings are filed as completed beans once fixed). Method: cat-harness `skills/conduct/security/`, the 16 rules of `voices/secure-code-authoring`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`.

**Category:** security · **Severity:** major

folio-assistant `.github/workflows/merge-main.yml` (`pull_request_target`). Rules `scz-no-privileged-untrusted-checkout`, `scz-least-privilege`.

The merge job minted the harness App token, checked out the PR head with the credential persisted, and ran the PR's own `mount-from-lock.sh`, `bun install` (lifecycle scripts) and `state:mount` before the main-side merge tool. Fork heads were already refused, so only someone who can push a branch could reach it, but that gave a branch author the App token's write rights.

**Fix:** folio-assistant `43c81d6` (2026-10-31): `persist-credentials: false`, every pre-merge step runs main's copy from a worktree, `bun install --ignore-scripts` in the PR tree, and the App token is minted only after the merge, for the push step.

## Done when

- [x] Fixed and merged
- [x] Filed publicly after the fix (owner Q-SEC-1 A)

_2026-11-01T21:00:00Z_ — Filed by the MVP security review thread (epic folio-assistant#2894, Phase 2b), session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS
