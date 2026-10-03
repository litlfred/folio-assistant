---
# folio-assistant-d6bw
title: 'Skills, processes and docs: QA lives on qa-reports — update every skill, BPMN and page that says test/results is committed'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-01T08:48:11Z
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



## From the reader audit (`gxvk`, 2026-10-01)
`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md` §5.6 lists 13 F-class sites. Files that tell an agent `test/results/**` is committed, missing from the list above:
- `skills/kg/graph-management/lsi-indexing.md` (4)
- `skills/sdlc/sdlc-core/platform-gates.md` (2)
- `skills/sdlc/sdlc-core/decision-audit.md` (2)
- `skills/kg/kg-core/skill-voice-review.md` (2): it must name `test/attestations/`
- one mention each in `wireframe-design-review`, `readme-sections`, `liquid-templates`, `gate-tree-mutation`, `coordinate`, `adjudication`, `role-model`, `methodology-adoption`, `domain-fencing`, `deletion-requires-confirmation`
- the memories `never-assert-on-a-qa-verdict-from-the-published-corpus`, `derive-the-gate-list-from-the-workflow` and `.claude/agent-memory/ci-health-watcher/MEMORY.md`

Counts are from `rg -c 'test/results|kg-qa sidecar|qa-results\.json' -g '*.md'`.
