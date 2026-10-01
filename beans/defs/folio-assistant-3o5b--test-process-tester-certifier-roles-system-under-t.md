---
# folio-assistant-3o5b
title: 'TEST PROCESS: tester + certifier roles, system-under-test actor facet, test-plan-execution.bpmn, certification DMN, kg-audit criteria'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-01T18:06:08Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-ygzh
---

Arc `3fva`, proposal §3.2 and §4 items 5.4 and 5.5. Blocked on the TEST PLAN schema bean.

`test-plan-execution.bpmn` has five lanes:
- Requester / SUT: requests certification against plan P.
- Tester: resolves the plan, binds the test data, executes, writes the run.
- Untainted checker: re-executes a sample (`untainted-verification`).
- Certifier: decides, using the DMN that `exitCriteria` names.
- Attestation service: signs, via a call activity to `qa-report-signing.bpmn`.

Roles: `tester` and `certifier` (a specialisation of `stakeholder` / `programme-manager`). The system-under-test facet goes on the actor, and is reachable by a machine or an agent.

`kg-audit` criteria:
- the plan resolves;
- every case was executed or skipped with a reason;
- the data hash is present;
- the SUT never wrote its own verdict.

## Done when
- [ ] `kg:audit` is clean on the new process, roles and criteria
- [ ] the process runs end to end through `workflow_start` / `workflow_complete`

Claim: worktree agent-aeed952a1045a7b02 (branch worktree-agent-aeed952a1045a7b02), session https://claude.ai/code/session_01LKpuPotV3Ve5Za75DQ3AQR, 2026-10-01. Not pushed; the parent session integrates.
