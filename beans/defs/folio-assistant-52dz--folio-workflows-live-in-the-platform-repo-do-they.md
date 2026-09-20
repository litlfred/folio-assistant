---
# folio-assistant-52dz
title: |-
    FOLIO WORKFLOWS live in the PLATFORM repo — do they belong here? them

    `AGENTS.md` already states the shape for two of them — 'qa-sweep and witness-refresh fail by design in this repo: the first preflights on content/package.json, the second needs computations/, and the platform carries no folio' — and adds 'do not fix a dispatch-only workflow by dispatching it'. So at least some are deliberate: the platform ships the workflow a folio will use.

    If that is the intent for all twelve, the question is whether a workflow a repository cannot run should live in it at all, or be part of what `folio_init` writes into a folio. If it is NOT the intent, some of these are dead files whose paths broke at the #223 split and nothing noticed — `check:ci-health` cannot see them because a path-filtered workflow that never fires has no runs to be red.

    They are now declared `no-folio` in `STEP_EXEMPTIONS` with reasons, so a machine can read what prose asserted. **That records what they are and does not decide where they go.**

    ## Done when

    - [ ] decide: shipped-for-a-folio, or dead since the split, per workflow
    - [ ] the shipped ones have a home that makes their non-running visible rather than silent
    - [ ] the dead ones go to `fsh-guts/`, never `rm`
status: todo
type: task
priority: normal
created_at: 2026-09-20T07:44:35Z
updated_at: 2026-09-20T07:44:48Z
parent: folio-assistant-1xhc
---

Measured 2026-09-20 while classifying every workflow step for bean `j2w4`. Fourteen workflows carry `bun` steps; **twelve distinct scripts among them run against a FOLIO's tree**, which this repository does not have:

`pipeline/build.ts`, `content/pipeline/qa-sweep.ts`, `qa-staleness`, `check-witnesses`, `render-atlas:write`, `content/pipeline/latex-overfull-report.ts` (reads `main.log`), `content/pipeline/qa-section-title-audit.ts` (from a ROOT `content/`), `scripts/audit-wiring.ts`, `scripts/section-story-audit.ts`, `trivial-skeleton-audit.ts` (`--cwd content`), `conditional-class-banner-audit.ts`, `codemod-leanval.ts`.

Across: `blueprint.yml`, `lean-build.yml`, `lean_ci.yml`, `publish.yml`, `qa-sweep.yml`, `qa-sweep-nightly.yml`, `section-title-audit.yml`, `witness-pipeline.yml`.

**One names `quantum-observable-universe` outright** — these were authored for `litlfred/qou` and live in the platform.

## Why this is not simply delete
