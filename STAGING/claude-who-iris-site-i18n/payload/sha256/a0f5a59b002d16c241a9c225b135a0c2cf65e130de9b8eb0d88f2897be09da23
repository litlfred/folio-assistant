---
# folio-assistant-n3ni
title: 'SMART-* SEPARATION: /smart-base/ landing page, generic IG page generator into fhir-harness, staged smart-* dirs into litlfred forks'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-01T08:10:21Z
updated_at: 2026-10-04T12:46:42Z
parent: folio-assistant-uhkv
---

Issue #1767. Owner 2026-10-01: landing page for /smart-base/; push generic stuff into fhir-harness first; staged smart-base, smart-trust (and smart-immunizations) belong in litlfred forks.

## Done when
Staged per cat-harness/docs/proposals/smart-separation-2026-10-01.md (owner decided Q1-a, Q2-a, Q3-b, Q5 reframed as qvxh).
- [x] A1 gen-smart-trust-pages -> fhir-harness/scripts/gen-ig-pages.ts; smart-trust output byte-identical (681 pages)
- [x] A2 smart-base docs/ with --summary landing page; tile now /smart-base/
- [x] A3 split plan written, questions asked and answered
- [x] A4 PR #1768 green  — merged 2026-10-01T16:21:51Z, merge commit `80434b7ec3`.
  Ticked on a JUDGEMENT that is stated so it can be disputed: its head carried 16
  check runs with one failure, `cleanup`. That is housekeeping, not a gate — gates
  here are suffixed `(hard)` or `(warn-only)` and `cleanup` is skipped on most
  runs — so every gate was green, which is what this box means by green. Had the
  red been a gate this box would have stayed open.
- [x] B fhir-harness takes generic ingest/schemas; wrong-direction edges 1-4 fixed; 4 generic Tool nodes
- [x] C fhir-harness visualizer: fhir-artifact-index kind viewer per instance; neutral sidecar overlay
- [x] D smart-base consolidated (theme, chrome re-key, needs repointed); L1/DAK kinds = qvxh
- [ ] E forks seeded (harness at litlfred/smart-base root; data under smart-base/)
- [ ] F f-a subscribes; cutover only on owner OK

## Progress 2026-10-04 (wm63 session)

Stages B, C and D are ticked on evidence: r939 (#1782), y4t4 (#1783) and kg83 (#1795) all merged with green gates and were closed in #2062. D's L1/DAK kinds stay with qvxh, as the box says. Remaining: E (forks seeded in litlfred/smart-base, outside this repo's session scope) and F (cutover, only on the owner's OK).

## Stage E, first fork (2026-10-04, wm63 session; owner: 'one fork first')

- litlfred/smart-trust#5 (draft): `smart-base/` seeded from folio-assistant's `smart-trust/`, with history carried (378 commits, git subtree split + add), plus a root `smart-base.config.json`. The IG source is untouched.
- **The falsifier, measured:** nothing in the seed runs standalone. `smart-base/scripts/tests/pages-markdown.test.ts` fails with "Cannot find module '../../../fhir-harness/...'". The fork needs the platform: either stage F's subscription or a folio-assistant submodule (owner's choice, asked).
- Not yet done: smart-base and smart-immunizations, which wait on the layout being accepted. Nothing in folio-assistant has been deleted (F).
