---
# folio-assistant-p3yl
$schema: bean/1.0.0
title: 'IG repo onboarding asks two owner questions: disable automatic gh-pages builds? just-the-docs site (default yes)?'
status: completed
type: task
created_at: 2026-10-06T16:21:43Z
updated_at: 2026-10-07T14:15:00Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-06: "make this part of the process/skill. if gh-pages is being populated, ask use if disable. ask use if they want justthedocs rendering (default is yes)". Follows #2291 (folio-site template manual-only) and #1901. Rule lives in fhir-harness ig-build-pipeline; fhir-ig-create and ig-render-jekyll point to it.

## Done when
- [x] the rule is in one skill with detect / ask-disable / ask-site / PR-fires-base-workflows steps
- [x] the skills that route IG adoption point to it
- [x] skill:register:check, reference-direction, docs:harness:check green

## Landed evidence

Landed on `main` in commit `49ef0e174802` via PR #2297 (`764f525a324d`).
- Rule written into `fhir-harness/skills/fhir-ig-base/ig-build-pipeline.md` §"Who starts a build: two owner questions before a repository publishes on its own" with the four steps (1. Detect, read-only; 2. Ask whether to disable automatic triggers; 3. Ask whether to render the IG with just-the-docs site; 4. Say what the pull request will fire).
- Pointed to from `fhir-harness/skills/fhir-ig-base/fhir-ig-create.md` (steps 5 and `existing-ig`) and `fhir-harness/skills/fhir-ig-base/ig-render-jekyll.md`.
- All checks green across `main`. Closed on evidence per `bean-coordination.md`.
