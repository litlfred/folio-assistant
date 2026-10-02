---
# folio-assistant-n3ni
title: 'SMART-* SEPARATION: /smart-base/ landing page, generic IG page generator into fhir-harness, staged smart-* dirs into litlfred forks'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-01T08:10:21Z
updated_at: 2026-10-02T12:28:26Z
parent: folio-assistant-uhkv
---

Issue #1767. Owner 2026-10-01: landing page for /smart-base/; push generic stuff into fhir-harness first; staged smart-base, smart-trust (and smart-immunizations) belong in litlfred forks.

## Done when
Staged per cat-harness/docs/proposals/smart-separation-2026-10-01.md (owner decided Q1-a, Q2-a, Q3-b, Q5 reframed as qvxh).
- [x] A1 gen-smart-trust-pages -> fhir-harness/scripts/gen-ig-pages.ts; smart-trust output byte-identical (681 pages)
- [x] A2 smart-base docs/ with --summary landing page; tile now /smart-base/
- [x] A3 split plan written, questions asked and answered
- [ ] A4 PR #1768 green
- [ ] B fhir-harness takes generic ingest/schemas; wrong-direction edges 1-4 fixed; 4 generic Tool nodes
- [ ] C fhir-harness visualizer: fhir-artifact-index kind viewer per instance; neutral sidecar overlay
- [ ] D smart-base consolidated (theme, chrome re-key, needs repointed); L1/DAK kinds = qvxh
- [ ] E forks seeded (harness at litlfred/smart-base root; data under smart-base/)
- [ ] F f-a subscribes; cutover only on owner OK

## 2026-10-02 — separation prep: one import seam per smart-* instance; AST pipeline renders from the IG checkout

Session https://claude.ai/code/session_01PricYFhYhFA5DuMJaWo3CE, branch `claude/smart-separation-platform-shims`.

- **One seam per instance.** The six relative imports from smart-* into `cat-harness/` (smart-base/tools/index.ts ×3, smart-trust/themes/themes.ts and its test ×3) now go through `<instance>/platform.ts`, which re-exports what the instance uses. Re-pointing the platform at separation is a one-file edit per instance. `cat-harness/scripts/tests/instance-separation-imports.test.ts` holds it: an instance with a `platform.ts` may climb out of its directory only there; smart-base and smart-trust are pinned as opted in. Calibrated: with the old imports it lists all six. The platform layers are out of its scope by design (`check:import-direction` and the arc govern them).
- **The plan's stage-E condition** ("if a fork cannot run gen-ig-pages without cloning folio-assistant, E needs a tools package first") is now half met: on PR #1816, `fhir-harness/scripts/ig-ast-site.sh --ig-root <IG checkout>` restores the IG's own `fhir-ast/*` cache and renders its pages with the same renderer, no ingest of its published output needed. Still needed: fhir-harness itself, i.e. the tools package.
