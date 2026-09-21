---
# folio-assistant-a58y
title: 'ENFORCE: qa-reporting gains its first consumer — a QA verdict whose reviewer cannot emit one is refused'
status: todo
type: task
priority: high
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

The declared permission `qa-reporting` — *"Emit QA reports"* — has **zero
non-test consumers**. Measured 2026-09-21: one comment in `role-graph.ts`, one
test asserting more than one role holds it, and nothing anywhere that consults
it when a verdict is written.

Five actors hold it (`ci-health-watcher`, `ci-pipeline`,
`ig-publisher-service`, `platform-boundary-guard`, `qc-reviewer`); **none** also
holds `content-authoring`. **The separation the owner asked for is already true
in the declaration.** What is missing is anything that would notice if it
stopped being true.

That is the `dh4f` shape: a consumer scanning something that is not there, and
a clean run over it. Here it is worse than the usual case, because the
declaration reads as a control.

## Done when

- [ ] A QA verdict names its reviewer, and the reviewer resolves to a declared
      actor — an unresolvable reviewer is a finding, not a skip
- [ ] A verdict whose reviewer is an actor without `qa-reporting` is refused
- [ ] Falsified in both directions: a coder-authored verdict turns it red, and
      the corpus's 5,883 script-authored entries do not
- [ ] The third state is distinct: **no reviewer recorded** is neither pass nor
      fail, and is reported as its own count
