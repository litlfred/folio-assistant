---
# folio-assistant-t3ad
title: Document the 70 gateways that gateway-documented fails on
status: todo
type: task
created_at: 2026-09-23T16:26:05Z
updated_at: 2026-09-23T16:26:05Z
---

Reported by `gateway-documented` (#1051, bean 6hq4), measured on main 2026-09-23: 70 exclusive/inclusive gateways across the processes/ corpus have no <documentation> saying what question they decide or what answers it. Count from the kg-qa sidecars (test/results/kg-qa/**), not from this text: re-run `bun run kg:audit` and count before starting.

Issue #1044 (closed): the criterion landed and this follow-up was left open.

## Done when
- [ ] every gateway-documented finding is fixed (documentation written from what the diagram's branches and the code actually do, not guessed), or scoped with a stated reason
- [ ] kg:audit regenerated and gates green
