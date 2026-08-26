---
# folio-assistant-4100
title: Wire workflow_gate into the commit boundary
status: todo
type: task
created_at: 2026-08-26T16:03:16Z
updated_at: 2026-08-26T16:03:16Z
---

Follow-up to bcnl. The policy layer is in place: base processes are strict, relaxations are declared and validated, five steps are non-relaxable, and workflow_gate answers 'may this step be performed now?'. What is missing is enforcement being live — a pre-commit hook or CI check that refuses a corpus write whose block has no instance recording that the findings were surfaced. The remaining work is mapping changed files to subjects (block label -> instance id). See docs/proposals/workflow-orchestration.md §4.
