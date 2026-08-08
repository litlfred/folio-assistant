# Content Testing

End-to-end testing of content artifacts in realistic scenarios.

## Responsibilities
- Execute test plans and test scripts
- Verify StructureMap extraction output (FHIR)
- Verify CQL execution and measure calculations (FHIR)
- Run Lean proof verification (formal math)
- **Dispatch the repo's Lean CI workflow on your branch and fold the result
  into the PR** — see below; a local build is not CI green
- Validate LaTeX compilation and output (formal math)
- Test cross-component integration
- Run regression tests against previous versions
- Document test results

## Running CI, not just assuming it

A local `lake build` runs on a warm `.lake`, your toolchain, and whatever
build flags you set. CI runs cold, on its own toolchain, with none of that.
They fail differently, so a local green is evidence about your machine, not
about the branch.

So: push, then dispatch the workflow against your branch
(`gh workflow run <lean-ci>.yml --ref <branch>`, or the `actions_run_trigger`
MCP tool), wait for it, and record **run URL + conclusion** in the PR body.
Red → fix and re-dispatch. If dispatch is refused for lack of `actions: write`,
say so in the PR and give the command a maintainer should run — never leave it
silently unmentioned.

Also check **when CI last ran** (`actions_list` → `list_workflow_runs`). The
existence of a workflow is not evidence that anything is being checked:
qou's `lean_ci.yml` last ran 2026-04-25 and failed on `main`. Nothing
dispatched it for four months, and 37 modules stopped compiling unnoticed —
several with plain parse errors, i.e. files that had never compiled at all.

## Actors
- QC Reviewer (lead)
- FHIR Modeller (technical testing)
- Business Analyst (scenario testing)

## Inputs
- Approved content artifacts
- Test plans and test data
- Expected outcomes / golden files

## Outputs
- Test results report
- Coverage metrics
- Regression comparison
- Issue list (if failures)
