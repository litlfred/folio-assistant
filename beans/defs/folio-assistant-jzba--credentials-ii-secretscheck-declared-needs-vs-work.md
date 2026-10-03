---
# folio-assistant-jzba
title: 'CREDENTIALS (ii): secrets:check — declared needs vs workflow usage vs secret names vs expiry registry'
status: todo
type: task
created_at: 2026-10-02T06:31:22Z
updated_at: 2026-10-02T06:31:22Z
parent: folio-assistant-5a3l
blocked_by:
    - folio-assistant-vobp
---

From the proposal cat-harness/docs/proposals/credentials-needs-and-supply.md §6.2. Code in cat-harness-tools. Names only, never values. Findings per §6.2, including could-not-determine, which outranks clean (exit 2). Warns at 30 and 7 days before expiry. Feeds bun run health. Has the MCP and CLI parity of axis 6. Declares its own need, list-secret-names, supplied by the App. Not built yet.

## Done when
- [ ] it runs over folio-assistant and bootstrap-tools and reports BOOTSTRAP_PAGES_TOKEN / PUBLISH_SITE_BOOTSTRAP as declared-not-present (or present)
- [ ] it is wired into bun run health with the basis for each threshold
