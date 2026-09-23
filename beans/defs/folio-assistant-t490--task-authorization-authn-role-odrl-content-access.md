---
# folio-assistant-t490
title: 'Task authorization: authN + role + ODRL + content access before every BPMN task; rbac.ts on ODRL'
status: completed
type: feature
priority: normal
created_at: 2026-09-23T22:16:45Z
updated_at: 2026-09-23T22:52:49Z
parent: folio-assistant-ahvw
---

Issue #1207 (child of #1180). Owner decisions 2026-09-23: advisory rollout (deny/role-mismatch refuse, unknown recorded), action always perform-task, authN is the BPMN executor's responsibility with git/GitHub as today's identity + access control, rbac.ts replaced by ODRL now.

## Done when
- [x] engine checks in workflow_gate + workflow_complete, verdict in history
- [x] rbac.ts routes on ODRL, gateway tiers as default policy
- [x] task-authorization skill + process skills updated
- [x] stale src/core/rbac.ts refs fixed

## Summary of Changes

PR #1214. `authorizeTask` (src/workflow/authorize.ts) runs in `complete()` and
`workflow_gate`: authenticated, assigned, authorized (`perform-task`), access
(`target`); verdict in `HistoryEntry.authz`. `src/core/access.ts` loads
policies + profile + actors once for both callers. `rbac.ts` asks ODRL; gateway
tiers are actors with grants in `policies/http-gateway.jsonld`. Skill
`task-authorization`; role-model, process-state, bpmn-processes,
deployment-auth and docs updated. Measured 2026-09-23: 615 tasks/gateways, 0
permit, 574 unknown, 41 in lanes no actor may take. Strict flip is the
follow-up bean.
