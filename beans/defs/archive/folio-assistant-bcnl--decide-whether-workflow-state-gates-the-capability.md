---
# folio-assistant-bcnl
title: Decide whether workflow state gates the capability tools, and where
status: completed
type: task
priority: normal
created_at: 2026-08-26T15:29:15Z
updated_at: 2026-08-26T16:03:15Z
---

The decision docs/proposals/workflow-orchestration.md §4 asks for. Phase 1 is advisory: an agent can ignore workflow_next and call content_validate directly, which is the same shape as bean 5rfy (29 of 32 workflows never fire on their own). Options: gate each capability tool on instance state; or gate once at the commit boundary via a hook/CI check that refuses a corpus write whose block has no instance recording that findings were surfaced. The proposal recommends the commit boundary — one place rather than twenty-five, and enforced by something other than an agent's intention to call it. Costs to weigh: it can block a one-line typo fix; partial coverage buys the appearance of a gate; and it needs an activity->tool mapping that does not drift.

## Summary of Changes

**Owner ruling: be strict on the base; content-specific skills may decide and
augment with relaxation guidance, if any.** Implemented as declared policy on
the artifacts themselves, not as convention.

- The three **content-agnostic** processes (`Process_Editing`,
  `Process_Publication`, `Process_Lifecycle`) carry
  `<folio:policy enforcement="strict"/>`. `workflow_gate` refuses a step that is
  not enabled.
- The three **per-content-type** processes are `advisory`. What counts as
  adequate review of a Lean proof and of a FHIR profile are different questions,
  and the package that knows the domain answers them.
- **Absent policy means strict.** A process that forgot to declare is governed,
  not exempt — defaulting the other way would mean forgetting silently turns the
  gate off.
- A package relaxes a base step in `skills/<package>/workflow-policy.json`
  **with a reason**. No reason, no load: an unexplained relaxation is a loophole,
  not a policy, and the file is the record of what was waived.
- **Five steps refuse to be relaxed at all** (`relaxable="false"`):
  `Task_ReviewFindings`, `Gateway_EditorDecision`, `Task_Commit` — the editor
  seeing the findings, the decision, the write — plus `Task_AuthorizeRelease`
  and `Task_PublishRelease`, which carry the `publish-authorized` SHALL.
- `bun run check:workflow-policy` validates every relaxation and now runs in CI,
  so one that has stopped applying (renamed activity, newly non-relaxable step)
  is a build failure rather than a discovery on the day it is needed.

Shipped policies: `authoring-math` declares one relaxation — the `Human / SME
review` branch, because a paper folio has no clinical SME lane and the scientific
judgement lives in the agent-review branch plus the author's own reading at the
findings gate, which is *not* waived. `authoring-who-smart-guidelines` declares
none, deliberately: a guideline's clinical review is the reason that branch
exists.

## A bug the work turned up

Splicing `<folio:policy relaxable="false"/>` into activities that already had an
`<bpmn:extensionElements>` block produced **two blocks on one element**. BPMN
allows one (maxOccurs 1), and the parser keeps only one — so
`Task_AuthorizeRelease` and `Task_PublishRelease` silently lost their policy and
read as relaxable. The XML stayed well-formed throughout, so nothing complained;
only probing the loaded model showed 3 non-relaxable steps where 5 were
expected. Merged, and the count is now asserted in the tests.

## Still open

Wiring `workflow_gate` into the commit boundary — a pre-commit or CI check that
refuses a corpus write whose block has no instance recording that the findings
were surfaced. The policy layer it would consult is in place and tested; what
remains is mapping changed files to subjects. Worth its own bean when someone
wants the enforcement live.
