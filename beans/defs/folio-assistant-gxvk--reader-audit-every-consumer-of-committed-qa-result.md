---
# folio-assistant-gxvk
title: 'READER AUDIT: every consumer of committed QA results, classified by how it must change when QA leaves main — with one fix bean per reader family'
status: in-progress
type: task
priority: high
created_at: 2026-10-01T08:15:59Z
updated_at: 2026-10-01T08:15:59Z
parent: folio-assistant-3fva
---

Owner request, 2026-10-01: "do an audit report/analysis on readers and queue up fix them." Arc `3fva`.

Scope: every code path, workflow step, MCP tool, skill and test that READS a file under any `*/test/results/**` or `test/health/results/**`. Writers are in scope only where they also read the prior file.

The output is a report, `cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, plus one fix bean per reader family, each under `3fva` and blocked by `16ei` (qa-store). The fix beans refine and split `oqe3` and `2ae2`; they do not duplicate them.

Held by branch claude/quirky-davinci-ixuymr, session https://claude.ai/code/session_01LKpuPotV3Ve5Za75DQ3AQR.

## Done when
- [ ] every reader is listed with file:line, what it reads, why, and the class it falls in (A gate-compare, B gate-reads-sidecar, C render/publish, D MCP/runtime, E test fixture, F agent/skill instruction, G merge tooling)
- [ ] each one has a migration action and its failure mode if the file is absent today: crash, false-clean, or correct unknown
- [ ] every false-clean reader is flagged critical
- [ ] fix beans are created, and oqe3/2ae2 point at them
