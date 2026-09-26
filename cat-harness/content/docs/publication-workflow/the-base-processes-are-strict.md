The three content-agnostic diagrams — editing, draft-to-publication, lifecycle —
carry `<cat-harness.processes:policy enforcement="strict"/>`. `workflow_gate` refuses a step
they have not reached. The three per-content-type diagrams are `advisory`,
because what counts as adequate review of a Lean proof and of a FHIR profile are
different questions, and the package that knows the domain should answer them.

A content package may relax a base step by declaring it in
`skills/<package>/workflow-policy.json` **with a reason** — an unexplained
relaxation does not load, so the file is the record of what was waived and why.
Five steps refuse to be relaxed at all: `Task_ReviewFindings`,
`Gateway_EditorDecision` and `Task_Commit` (the editor seeing the findings, the
decision, the write), plus `Task_AuthorizeRelease` and `Task_PublishRelease`
(the `publish-authorized` SHALL). If those were negotiable the base would not be
strict, it would be a suggestion.

`bun run check:workflow-policy` lists the policy and validates every relaxation;
it runs in CI, so one that has stopped applying is a build failure rather than a
discovery on the day it is needed.

**The commit boundary is where this is enforced rather than merely answerable.**
`scripts/check-corpus-gate.ts`, run in the folio repo from a pre-commit hook or
CI, refuses a changed content block that no instance records the editor having
authorised. `workflow_gate` answers an agent that asks; the hook does not depend
on anyone asking.

```sh
bun run <platform>/scripts/check-corpus-gate.ts --staged --platform <platform>
bun run <platform>/scripts/check-corpus-gate.ts --staged --warn   # adopt gradually
```
