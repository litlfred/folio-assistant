---
# folio-assistant-t490
title: 'Task authorization: authN + role + ODRL + content access before every BPMN task; rbac.ts on ODRL'
status: in-progress
type: feature
created_at: 2026-09-23T22:16:45Z
updated_at: 2026-09-23T22:16:45Z
---

Issue #1207 (child of #1180). Owner decisions 2026-09-23: advisory rollout (deny/role-mismatch refuse, unknown recorded), action always perform-task, authN is the BPMN executor's responsibility with git/GitHub as today's identity + access control, rbac.ts replaced by ODRL now.

## Done when
- [ ] engine checks in workflow_gate + workflow_complete, verdict in history
- [ ] rbac.ts routes on ODRL, gateway tiers as default policy
- [ ] task-authorization skill + process skills updated
- [ ] stale src/core/rbac.ts refs fixed
