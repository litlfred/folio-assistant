---
# folio-assistant-3o2w
$schema: bean/1.0.0
title: 'SECURITY REVIEW 2026-10-31, group D: smart-trust, who-iris, dth-hrh, bootstrap'
status: in-progress
type: epic
priority: high
tags:
    - security-review-2026-10-31
    - security
created_at: 2026-10-31T04:10:00Z
updated_at: 2026-10-31T08:21:00Z
---

The owner asked (2026-10-31 03:51Z, thread "Security review all harnessed KG code") for a full QA and security review of all code harnessed in a KG, with findings recorded per the SOPs. This epic holds group D's public findings. The sibling epic for cat-harness and cat-harness-tools is `cat-tools-sr31` in the cat-harness-tools store.

Reviewed heads (main): smart-trust `496290a`, who-iris `df8f63f`, dth-hrh `ffb89eb`, bootstrap `3ce2b5d`.

**Method.** SOP: cat-harness `skills/conduct/security/` (security.md, injection-boundaries, path-containment, zero-trust-handover) and the 16 rules of the `secure-code-authoring` voice; categories from cat-harness-tools `schemas/sdlc/red-flag.ts`. Each repo's checks were run from a checkout with the layers mounted at cat-harness-tools/folio-assistant-core main: `security-gate.ts`, then `check-workflow-injection`, `check-secret-leaks`, `check-lockfile-pinning`, `check-dependency-advisories` directly, plus `bun audit`, a secret-pattern grep, and a manual sink sweep (exec/shell strings, path joins from external ids, innerHTML, `${{ }}` in run blocks, `pull_request_target`, unpinned actions, outbound fetches).

**Held findings.** Seven findings that describe how to attack a running system or its CI (one reproduced) are held out of this public store until the owner decides how to disclose them: `/mnt/project-files/security-review-2026-10-31/held-findings-group-d-trust-iris-dth.md` (3 high, 2 normal, 2 low). They get beans here when that is decided.

**No finding:** dth-hrh's own code (generators use `json.dumps`, slugs are `[a-z0-9-]`), bootstrap's skills and processes (no injected instructions found), secret-pattern grep in all four repos (no keys or tokens committed), no `pull_request_target` or `issue_comment` triggers anywhere.

**Tooling gap (reported to cat-tools-sr31, not filed here):** in all four instances `security:gate` reports every pinned check `unknown` (the script table finds no `checkoutScripts`), and `check-secret-leaks` crashes on instance-declared graph typologies (`ig-ast`, `catalogue`, `public-comments`). The checks could only be run by calling the scripts directly.

_2026-10-31T04:15:00Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

**Update 04:24Z:** the seven held findings were fixed in who-iris#140 (`887aeea`) and smart-trust#98 (`f5446e7`), and are now filed here as completed beans: 7yp7 (H1), 0d23 (H2), 56jc (H3), nn9p (H4), ztg5 (H5), wea0 (H6), 0q34 (H7).

_2026-10-31T08:21:00Z_ — Open PRs for all 7 Group D beans (DO NOT MERGE until reviewed):
- `litlfred/smart-trust`: https://github.com/litlfred/smart-trust/pull/99 (`1sc6`, `xbfx`, `rx8k`, `hto2`, `a3fj`; builds on https://github.com/litlfred/smart-trust/pull/98)
- `litlfred/who-iris`: https://github.com/litlfred/who-iris/pull/143 (`hto2`, `a3fj`)
- `litlfred/dth-hrh`: https://github.com/litlfred/dth-hrh/pull/62 (`vj2d`, `hto2`, `a3fj`)
- `litlfred/bootstrap`: https://github.com/litlfred/bootstrap/pull/34 (`dnrj`)
