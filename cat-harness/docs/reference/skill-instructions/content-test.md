---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Content Testing'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring/content-lifecycle/content-test.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring/content-lifecycle/content-test.md) — do not edit here. Typed contract: [schema reference](../skills/content-test.html).
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring/content-lifecycle/content-test.md){: .fa-edit-source data-fa-link="edit" data-src="cat-harness/skills/authoring/content-lifecycle/content-test.md" data-repo="litlfred/folio-assistant" }

{% raw %}
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

## A green build only covers what the target reaches

Before reading "build green" as a claim about the corpus, check what the build
target actually compiles. Build systems default to **narrow roots**: Lake's
`lean_lib` uses `globs := roots.map Glob.one`, so `lake build` compiles the
root module plus its transitive `import`s — not the source directory.
`srcDir` widens where sources are *found*, never what is *built*.

Measured in qou on 2026-08-08: `lake build` reached **853 of the 1618**
modules under `lean/QOU/`. The other 766 (47%) had no olean at all — among
them the module holding the single `sorry` gating the Specht chain, which is
why the package build's sorry-warning list omitted it.

The check is cheap in any build system — count artifacts against sources:

```sh
find .lake/build/lib/lean/QOU -name '*.olean' | wc -l   # 860
find QOU -name '*.lean' | wc -l                         # 1618
```

A ratio far from 1 means the green is scoped, and **any corpus-wide number
read off that build — sorry counts, coverage, warning totals — is an
undercount by construction.** Say what the build covered, not just that it
passed.

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

## Where the results go — not into a commit

A test run's results are **derived**: re-running the plan over the same tree
and data reproduces them. So they are kept where every derived QA result is
kept since arc `3fva` — the orphan **`qa-reports`** branch, keyed by the
commit they were computed on (`main/<sha>/`, `pr/<n>/<sha>/`), written by
`bun run qa:publish` (the CI job `qa-publish`) and read back with `bun run
qa:fetch`. **Do not regenerate a results file in order to commit it**; the
checkout's `test/results/` is a working copy, still on `main` only until bean
`5hox` removes it.

Two things a test run produces are not derived, and they stay on `main`:

- **A reviewer's judgement** of a case — an SME or QC reviewer's verdict, an
  agent's adjudication — goes to `test/attestations/` (`qa-attestations/v1`),
  because no re-run can reproduce it.
- **A certification** — an accountable decision taken on a plan's rollup —
  also stays on `main`, beside the attestations (owner decision D5, default
  (a)), and is then signed through
  [`qa-report-signing`](qa-report-signing.md).

"Regression comparison" against a previous version is a comparison against
its **stored** results: `--against <ref>` on a gate, or `qa:fetch --ref` for a
report. A previous version with no stored entry is UNKNOWN — say so; never
read it as "no regressions".
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [QA report signing](../../processes/qa-report-signing.html) | Build the test run [folio-test-run/v1] |
| [Adopting an upstream version bump](../../processes/upstream-version-adoption.html) | Run the row's gates tests · e2e · site-links |
| [Content lifecycle](../../processes/content-lifecycle.html) | Integration test and QA sweep |
| [Draft, review and publish](../../processes/draft-to-publication.html) | Run publication QA gates |
| [Editing and HCI validation](../../processes/editing-hci-validation.html) | Build and QA gates |

