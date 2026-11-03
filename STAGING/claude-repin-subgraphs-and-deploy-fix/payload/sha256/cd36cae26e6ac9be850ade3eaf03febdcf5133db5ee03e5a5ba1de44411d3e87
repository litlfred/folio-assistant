---
# folio-assistant-ytsf
$schema: bean/1.0.0
title: 'build-ig-indexes: instance name into sh -c and rm -rf (held C-H2)'
status: completed
type: bug
priority: high
created_at: 2026-11-01T21:00:00Z
updated_at: 2026-11-01T21:00:00Z
parent: folio-assistant-33iz
tags:
    - security
    - security-review-2026-10-31
    - red-flag-security
---

Held finding of the 2026-10-31 security review, filed after its fix merged (owner Q-SEC-1 A, 2026-11-01 20:57Z: held findings are filed as completed beans once fixed). Method: cat-harness `skills/conduct/security/`, the 16 rules of `voices/secure-code-authoring`, RED FLAG categories of cat-harness-tools `schemas/sdlc/red-flag.ts`.

**Category:** security · **Severity:** major

litlfred/fhir-harness `scripts/build-ig-indexes.ts`. Rules `scz-every-input-is-suspect`, `scz-value-never-becomes-program-text`; path-containment.md.

An instance declaration's `name` was used unchecked in `join(work, name)` before `rmSync(..., {recursive: true})` and interpolated into a `sh -c` command line, so a crafted name could delete outside `--work` or run shell.

**Fix:** fhir-harness#244 (merged 2026-10-31): names pass `safeSegment`, and arguments go as argv.

## Done when

- [x] Fixed and merged
- [x] Filed publicly after the fix (owner Q-SEC-1 A)

_2026-11-01T21:00:00Z_ — Filed by the MVP security review thread (epic folio-assistant#2894, Phase 2b), session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS
