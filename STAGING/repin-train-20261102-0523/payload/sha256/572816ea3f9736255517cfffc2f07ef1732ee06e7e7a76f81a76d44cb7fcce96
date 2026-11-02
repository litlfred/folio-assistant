---
# folio-assistant-98uf
$schema: bean/1.0.0
title: 'RA Mapper: stored XSS from an imported ArchiMate model (held C-H1)'
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

litlfred/smart-ra `tools/ra-mapper/template.html` (published at `en/mapper/`). Rule `scz-value-never-becomes-program-text`.

`esc()` skipped `'`, several sinks (folder names, type labels, an element id inside an inline `onchange`) were not escaped at all, and an imported `.archimate` model was saved to `localStorage` and re-rendered on every visit. A crafted model opened once ran script on later visits, on the shared `litlfred.github.io` origin.

**Fix:** smart-ra#177 (merged 2026-10-31).

## Done when

- [x] Fixed and merged
- [x] Filed publicly after the fix (owner Q-SEC-1 A)

_2026-11-01T21:00:00Z_ — Filed by the MVP security review thread (epic folio-assistant#2894, Phase 2b), session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS
