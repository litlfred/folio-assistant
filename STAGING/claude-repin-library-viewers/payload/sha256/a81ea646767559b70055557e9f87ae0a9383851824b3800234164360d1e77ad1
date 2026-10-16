---
# folio-assistant-squu
$schema: bean/1.0.0
title: 'S5 pre: sci plug-in hook (Q4) — generic pipeline consults a registry instead of importing maths modules'
status: completed
type: task
priority: high
created_at: 2026-10-01T19:46:49Z
updated_at: 2026-10-07T18:03:00Z
parent: folio-assistant-7x5n
---

Owner ruling 2026-10-01 ~18:15: the 73 sci-bound files go straight to folio-assistant-sci, not via cat-harness-tools. Prerequisite: invert the 10 generic → sci-bound import edges (qa-criteria-registry, qa-checkers-voice, render-value, render-latex, qa-checkers-extended, build, content-graph, markdown-ast, profile-check, qa-checkers-q-usage) through a registration hook in the contentAdapters/loadContributions shape (schemas/contributions.ts); a collision throws. No files move in this PR.

## Done when

- [ ] generic pipeline code reaches sci-bound modules only through the hook
- [ ] QA and render outputs byte-identical (witness/sidecar --check)
- [ ] hook tests: registration, duplicate throws, unregistered kind clear error
- [ ] PR green; list of git-mv-able files recorded for the follow-up move PR



Claimed by session_01ToWZR4RgTRCWeSsgxsSQfT (sub-agent), branch claude/s5-sci-plugin-hook, 2026-10-01.

## Evidence: Closed on Landed Work

Delivered and landed in PR #1827 (commit `0f36eeca0d5b`):
- `pipelinePlugins` contribution kind added to `ContributionRegistry` in `cat-harness/schemas/contributions.ts`.
- 10 generic-to-sci import edges inverted to route through `cat-harness/content/pipeline/pipeline-plugins.ts`.
- Tests pass in `cat-harness/content/pipeline/pipeline-plugins.test.ts`.
