---
# folio-assistant-jb60
$schema: bean/1.0.0
title: 'sci lean-kg-viewer put unsanitised HTML on the page (held B-H4, sci part)'
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

**Category:** security · **Severity:** minor

folio-assistant-sci `adapters/paper/lean/lean-kg-viewer/viewer.js`. Rule `scz-value-never-becomes-program-text`.

Docstrings from ingested Lean sources went through `marked` (which does not sanitise) into `innerHTML`, as did fetched signature chunks; marked and MathJax loaded from CDNs without SRI. The core half of this finding (public-comment-site `fromRow`, `javascript:` hrefs) is folio-core-4kq2.

**Fix:** folio-assistant-sci `9ca9d54` (2026-10-31): DOMPurify sanitises, plain text when no sanitiser loads, and every CDN script is pinned with `integrity=`.

## Done when

- [x] Fixed and merged
- [x] Filed publicly after the fix (owner Q-SEC-1 A)

_2026-11-01T21:00:00Z_ — Filed by the MVP security review thread (epic folio-assistant#2894, Phase 2b), session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS
