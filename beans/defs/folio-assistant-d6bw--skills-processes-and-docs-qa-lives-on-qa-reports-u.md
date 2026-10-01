---
# folio-assistant-d6bw
title: 'Skills, processes and docs: QA lives on qa-reports — update every skill, BPMN and page that says test/results is committed'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-01T08:00:55Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, proposal §4 Phase 4. Can be dispatched once qa-store lands. Edit the SKILL, not AGENTS.md. AGENTS.md gets a pointer only.

- Skills:
  - `qa-witness`
  - `prepare-merge` §"Conflicts in test/results/"
  - `audit-coverage`
  - `directory-conventions`
  - `content-context-and-state-graphs`
  - `skill-registration`
  - `ci-health`
  - `untainted-verification`
  - `qa-report-signing`
  - `test-engineer`
  - `content-test`
- Processes:
  - `code-quality-gates.bpmn`, which gains a publish step
  - a new `qa-publish.bpmn`
  - `qa-report-signing.bpmn`, whose output goes to the branch
- Then `skill:register` and `render:bpmn`.

## Done when
- [ ] no skill tells an agent to commit or hand-resolve `test/results/**`
- [ ] `skill:register:check` and `render:bpmn:check` are green
