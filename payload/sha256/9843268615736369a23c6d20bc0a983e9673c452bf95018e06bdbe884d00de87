---
# folio-assistant-3o2w
$schema: bean/1.0.0
title: 'SECURITY REVIEW 2026-10-31, group D: smart-trust, who-iris, dth-hrh, bootstrap'
status: todo
type: epic
priority: high
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T04:10:00Z
---

The owner asked (2026-10-31 03:51Z, thread "Security review all harnessed KG code") for a full QA and security review of all code harnessed in a KG, with findings recorded per the SOPs. This epic holds group D's public findings. The sibling epic for cat-harness and cat-harness-tools is `cat-tools-sr31` in the cat-harness-tools store.

Reviewed heads (main): smart-trust `496290a`, who-iris `df8f63f`, dth-hrh `ffb89eb`, bootstrap `3ce2b5d`.

**Method.** SOP: cat-harness `skills/conduct/security/` (security.md, injection-boundaries, path-containment, zero-trust-handover) and the 16 rules of the `secure-code-authoring` voice; categories from cat-harness-tools `schemas/sdlc/red-flag.ts`. Each repo's checks were run from a checkout with the layers mounted at cat-harness-tools/folio-assistant-core main: `security-gate.ts`, then `check-workflow-injection`, `check-secret-leaks`, `check-lockfile-pinning`, `check-dependency-advisories` directly, plus `bun audit`, a secret-pattern grep, and a manual sink sweep (exec/shell strings, path joins from external ids, innerHTML, `${{ }}` in run blocks, `pull_request_target`, unpinned actions, outbound fetches).

**Held findings.** Seven findings that describe how to attack a running system or its CI (one reproduced) are held out of this public store until the owner decides how to disclose them: `/mnt/project-files/security-review-2026-10-31/held-findings-group-d-trust-iris-dth.md` (3 high, 2 normal, 2 low). They get beans here when that is decided.

**No finding:** dth-hrh's own code (generators use `json.dumps`, slugs are `[a-z0-9-]`), bootstrap's skills and processes (no injected instructions found), secret-pattern grep in all four repos (no keys or tokens committed), no `pull_request_target` or `issue_comment` triggers anywhere.

**Tooling gap (reported to cat-tools-sr31, not filed here):** in all four instances `security:gate` reports every pinned check `unknown` (the script table finds no `checkoutScripts`), and `check-secret-leaks` crashes on instance-declared graph typologies (`ig-ast`, `catalogue`, `public-comments`). The checks could only be run by calling the scripts directly.
