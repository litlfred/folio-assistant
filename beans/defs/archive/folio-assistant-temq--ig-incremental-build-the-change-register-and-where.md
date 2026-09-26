---
# folio-assistant-temq
title: IG incremental build — the change register and where each change sits in the review and publish pipeline
status: completed
type: task
priority: high
tags:
    - smart-guidelines
    - ig-publisher
created_at: 2026-09-16T09:54:56Z
updated_at: 2026-09-16T09:54:56Z
---

## Brief

**What, and why.** `docs/proposals/ig-incremental-build.md` (merged in #182) is the
analysis. The author asked for the companion a reviewer and a publication manager need:
one document that lists every requested change, says why it exists, and pins it to the
stage of the **review** and **publish** pipeline where it runs — the BPMN processes in
this repo (`l3-fhir-pipeline`, `draft-to-publication`, `editing-hci-validation`) and
smart-base's real workflows (`pr-preview`, `pr-validate-slash`, `pr-deploy-slash` for
review; `ghbuild`, `release`, `fhirbuild` for publish).

**What I already know.** Everything in the proposal, measured 2026-09-16. smart-base's
review path is `pull_request_target` → approval environment → `ghbuild.yml` for the PR
head; `/validate` and `/deploy` dispatch the same `ghbuild.yml`; publish is push-to-main
→ `ghbuild.yml` → gh-pages, and a GitHub release → `smart-html` release workflow when
`publication-request.json` exists. Every one of those runs the same full build.

**Plan and gate.** Write `docs/proposals/ig-incremental-build-overview.md`: the change
register (what / why / where / owner / phase / how you know), the stage-by-stage map for
both paths, the BPMN activity mapping, and one worked run. If the process picture earns
its place, author it as BPMN under `processes/` (this repo's rule), generate the
SVG with `bun run render:bpmn`, and add it to the workflow index. Gate: `render:bpmn:check`,
generated-docs checks, `bun test`. Falsifier: if a change cannot be pinned to a stage,
it is not a pipeline change and gets moved to "open decisions" instead of the map.

**Not doing.** No code for the services, no smart-base edits, no publisher Java.

## Progress (2026-09-16)

- Issue #187. `docs/proposals/ig-incremental-build-overview.md`: the pipeline as it is
  (six smart-base triggers, one build; the BPMN activities), the eleven-row change
  register (what · why · where · owner · phase), the review-path and publish-path maps,
  the activity-by-activity table, one worked run with exit codes, roll-out by phase,
  six decisions for the author.
- `processes/ig-incremental-build.bpmn` (+ generated SVG): the incremental build
  as a BPMN process, six lanes, 27 nodes; loads in the workflow interpreter as advisory.
  Indexed on the publication-workflow page and shown in the WHO SMART IG guide under
  "Making the build incremental" (site-content section + regenerated pages).
- Gates: gen-docs-pages --check, render:bpmn:check, gen-skill-docs/gen-schema-docs
  --check, check:workflow-policy, eslint, bun test (1,442 pass).

## Summary of Changes

- `docs/proposals/ig-incremental-build-overview.md` — the change register (R1–R11),
  the review-path and publish-path maps, the activity-by-activity table, one worked
  run with exit codes, roll-out by phase, six decisions for the author.
- `processes/ig-incremental-build.bpmn` + generated SVG — the incremental build as
  a BPMN process (six lanes, 27 nodes, advisory), generated layout; loads in the
  workflow interpreter; indexed on the publication-workflow page and shown in the WHO
  SMART IG guide ("Making the build incremental").
- PR #188 (issue #187). Follow-ups, each its own bean when the author picks one: the
  eleven register rows, in the phase order of the proposal's §7.
