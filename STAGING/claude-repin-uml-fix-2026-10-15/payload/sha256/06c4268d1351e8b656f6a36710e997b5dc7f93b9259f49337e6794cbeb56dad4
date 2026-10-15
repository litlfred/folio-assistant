---
# folio-assistant-jzba
$schema: bean/1.0.0
title: 'CREDENTIALS (ii): secrets:check — declared needs vs workflow usage vs secret names vs expiry registry'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T06:31:22Z
updated_at: 2026-10-11T06:52:45Z
parent: folio-assistant-5a3l
blocked_by:
    - folio-assistant-vobp
---

From the proposal cat-harness/docs/proposals/credentials-needs-and-supply.md §6.2. Code in cat-harness-tools. Names only, never values. Findings per §6.2, including could-not-determine, which outranks clean (exit 2). Warns at 30 and 7 days before expiry. Feeds bun run health. Has the MCP and CLI parity of axis 6. Declares its own need, list-secret-names, supplied by the App. Not built yet.

## Done when
- [ ] it runs over folio-assistant and bootstrap-tools and reports BOOTSTRAP_PAGES_TOKEN / PUBLISH_SITE_BOOTSTRAP as declared-not-present (or present)
- [ ] it is wired into bun run health with the basis for each threshold

## Assigned (2026-10-10 17:5x UTC, drain ml9h)

Owner asked lane A to dispatch more to lane B; assigned to lane B (session_01QmRtjQNyHiH2RuimTfuJDu), whose repo (litlfred/cat-harness-tools) holds the code. Lane A will not start it.

## Progress (2026-10-11, lane B)

cat-harness-tools#97 merged (secrets:check: names only, exit 0/1/2, 30/7/0-day expiry). Health wiring #116 in CI; MCP parity outstanding.
