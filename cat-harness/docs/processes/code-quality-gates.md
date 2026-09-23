---
title: 'The gates a change must pass before it can merge'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/code-quality-gates.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# The gates a change must pass before it can merge

`Process_CodeQualityGates` · strict · 6 step(s)

SIX INDEPENDENT JOBS, AND NOTHING IN THE YAML SAYS SO IN ONE PLACE. Bean `7yvd`. The file reads as a long sequence; it is not one. No job declares `needs:`, so all six start together and the wall-clock cost of the whole workflow is the SLOWEST job, not the sum. That is the single most useful thing to know before adding a gate, and it is recoverable today only by checking five `needs:` keys that are not there.&#10;&#10;THE ASYMMETRY IS THE OTHER HALF. Four jobs are HARD and TWO report without blocking &#8212; `rust-wildcard` and `dependency-advisories`. Drawing them as six equal boxes would be a lie a reader would act on, so both warn-only jobs are labelled as such and the gateway after the join asks specifically about the HARD ones.&#10;&#10;THE TWO WARN-ONLY JOBS ARE WARN-ONLY BY DIFFERENT MECHANISMS, AND THE DIFFERENCE IS THE POINT. `rust-wildcard` carries `continue-on-error: true` &#8212; the RUNNER discards its result. `dependency-advisories` carries no such flag: its script exits 0 in every state and keeps the three states apart in its OUTPUT instead. That is deliberate, because a warn-only step whose exit code says nothing has only its output left to distinguish `found nothing` from `could not find out`, and `continue-on-error` would have thrown away the one signal that still worked.&#10;&#10;`continue-on-error` IS NOT A DEFAULT HERE, it is a decision that has been REVERSED once already: `python-imports` carried it, and the flag swallowed a failure on a missing path, so the job reported success over a check that never ran. It was removed and a new unused import now fails. The flag STILL survives on exactly one job &#8212; adding a second warn-only job did not add a second `continue-on-error`, which is the history being honoured rather than an oversight. Anyone reaching for the flag should read that paragraph first.&#10;&#10;`TypeScript` IS ONE BOX STANDING FOR ROUGHLY THIRTY REPOSITORY GATES &#8212; workflow policy, AGENTS.md cross-references and claims, declared assets, workflow skill refs and BPMN coverage, the knowledge-graph audit, generated-docs currency, agent memory, and the ratchet that fails a check script no workflow runs. They are sequential only because one job runs them; each is independent, and `bun run gates` is the local runner derived from this job so a contributor can run the same set before pushing.&#10;&#10;Mechanical throughout. Nothing here waits on a person, which is what makes `build-pipeline` the right lane rather than a convenient one.

<img src="../assets/img/workflows/code-quality-gates.svg" alt="BPMN diagram: The gates a change must pass before it can merge" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| CI/CD Pipeline | — | Joins all six jobs before asking anything, then GW_Hard asks specifically about the four HARD ones — both warn-only results reach the same join but never the gate, so this lane's merge/block call is deliberately blind to a red job it also ran, which is where the five-are-not-four asymmetry actually bites. |

## Steps

Every one of the 6 step(s) is documented.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Lean: no bare&#10;`import Mathlib` (HARD)**<br>`Task_Lean` | CI/CD Pipeline | [`platform-gates`](../reference/skill-instructions/platform-gates.html) | Fail on any bare `import Mathlib` in content/**/*.lean — targeted imports only. In this platform repo there is no content/, so the job prints SKIP and states that nothing was scanned rather than passing silently. |
| **Python: unused and&#10;wildcard imports (HARD)**<br>`Task_Python` | CI/CD Pipeline | [`platform-gates`](../reference/skill-instructions/platform-gates.html) | ruff F401 (unused) and F403 (wildcard) imports over the Python trees that exist, then the Python tests. A tree that is absent is dropped rather than passed to ruff, and an empty set says SKIP — a missing path must not be swallowed as a pass. |
| **TypeScript: tests, lint, types,&#10;and ~30 repository gates (HARD)**<br>`Task_TypeScript` | CI/CD Pipeline | [`platform-gates`](../reference/skill-instructions/platform-gates.html) | bun test, lint, tsc --noEmit, then the repository gates (workflow refs, lane and process documentation, kg:audit:check, detangle, skills, …). `bun run gates` derives its list from this job, so it is the local way to run the same set before pushing. |
| **End-to-end +&#10;accessibility (HARD)**<br>`Task_E2E` | CI/CD Pipeline | [`platform-gates`](../reference/skill-instructions/platform-gates.html) | Install Chromium, check the rendered BPMN SVGs are current, then run the Playwright suite, which includes the accessibility checks. Hard: a failure blocks the PR. |
| **Rust wildcard imports&#10;(WARN-ONLY)**<br>`Task_Rust` | CI/CD Pipeline | [`platform-gates`](../reference/skill-instructions/platform-gates.html) | Report non-test `use …::*;` in tools/**/*.rs, excluding `use super::*;`. continue-on-error: it reports and never blocks, which is why it is labelled WARN-ONLY rather than drawn like the hard jobs. |
| **Dependency advisories&#10;(WARN-ONLY)**<br>`Task_Advisories` | CI/CD Pipeline | [`platform-gates`](../reference/skill-instructions/platform-gates.html) | Asks the one question the lockfile cannot: is anything in the resolved tree KNOWN-VULNERABLE? Warn-only by the owner's ruling on bean `j41m` — a hard gate here would hand a transitive advisory nobody can patch the power to red every PR, and the suppression that follows is what rots. `.github/dependabot.yml` is the other half of that ruling and is NOT drawn here: it is not a job in this workflow, it runs on Dependabot's schedule. |

{% endraw %}
