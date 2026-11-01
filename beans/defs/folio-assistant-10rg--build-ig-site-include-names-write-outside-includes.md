---
# folio-assistant-10rg
$schema: bean/1.0.0
title: 'build-ig-site: include names write outside _includes (held C-H4)'
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

litlfred/fhir-harness `scripts/build-ig-site.ts`. path-containment.md.

Any token after `{% include` or `{% lang-fragment` in an IG page became a path under `_includes` for `writeFileSync` / `copyFileSync` with no containment, so a page could write outside the site output.

**Fix:** fhir-harness#244 (merged 2026-10-31): include names must be a single safe segment.

## Done when

- [x] Fixed and merged
- [x] Filed publicly after the fix (owner Q-SEC-1 A)

_2026-11-01T21:00:00Z_ — Filed by the MVP security review thread (epic folio-assistant#2894, Phase 2b), session https://claude.ai/code/session_01Qmmkt7zjJDpkdmxtXvQWTS
