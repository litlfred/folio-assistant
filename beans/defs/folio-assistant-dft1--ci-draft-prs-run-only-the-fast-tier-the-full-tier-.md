---
# folio-assistant-dft1
$schema: bean/1.0.0
title: 'CI: draft PRs run only the fast tier; the full tier runs once the PR is ready for review'
status: completed
type: task
priority: normal
parent: folio-assistant-ksek
created_at: 2026-10-23T16:21:05Z
updated_at: 2026-10-24T15:11:00Z
---

Owner, 2026-10-23 ("1y"). No PR workflow skipped drafts, and drafts were most of the runner queue: about 59 queued runs that day on the account's shared runners, and 14 of cat-harness's 18 open PRs were drafts. Agents still need quick feedback on a draft, so a draft runs the cheap tier: typecheck, lint, and whatever each workflow already treats as fast or "prepare". The expensive tier (sharded tests and gates, e2e, staging deploys, the comparison with main) runs only when the PR is not a draft. `ready_for_review` is a trigger, so the full tier runs as soon as a PR is marked ready.

Safety rule: a green result from a draft-only run must never be the newest run on a head that merge-guard judges after the PR is marked ready. Each workflow that skips its full tier on drafts therefore also triggers on `ready_for_review`. A `types:` list used to make `workflow-events.ts` classify a workflow as `conditional` rather than `required`, which would have weakened merge-guard check 5 and merge-steward. Now a `types:` list that keeps all three of GitHub's default types (opened, synchronize, reopened) is still `required`.

Plan:
- cat-harness-tools: add a `draft-fast-tier` input to `layer-pr-checks.yml`, off by default. Turned on, a draft runs prepare-head and the typecheck only, and `compare` passes with "draft: full tier skipped" or fails on the typecheck. Draft tiering for its own `pr-tests.yml`. The `triggerFor` refinement.
- folio-assistant: `code-quality-gates.yml` runs only hygiene plus lint and types on a draft, and its `Repository gates (hard)` roll-up passes with a note. `feature-staging.yml` builds no preview for a draft. Both trigger on `ready_for_review`. Merge order: after folio-assistant pins a cat-harness-tools that carries the `triggerFor` change.
- Follow-up, after the cat-harness-tools PR merges: the 11 callers of `layer-pr-checks.yml` add `ready_for_review` to their `pull_request` types and set `with: { draft-fast-tier: true }`. The callers are bootstrap, bootstrap-tools, cat-harness, folio-assistant-core, folio-assistant-sci, fhir-harness (which keeps its explicit list), smart-base, who-iris, smart-ra, smart-immunizations and smart-immunizations-uganda. Branch `claude/draft-fast-tier` in each.

Done when the cat-harness-tools PR, the folio-assistant PR and the 11 caller PRs are merged, and a draft PR in one layer shows a fast-tier-only run followed by a full run on ready_for_review.

## 2026-10-23: PRs opened

- litlfred/cat-harness-tools#616 (issue #615): the `draft-fast-tier` input, opt-in; `pr-tests.yml` draft tiering; the `triggerFor` default-types rule. Merges first.
- litlfred/folio-assistant#2645 (issue #2644): `code-quality-gates.yml` and `feature-staging.yml`. Merges after cat-harness-tools is re-pinned past #616.
- The 11 caller PRs are opened once #616 has merged.

## 2026-10-23: caller PRs opened and marked ready (umbrella issue cat-harness-tools#625)

cat-harness-tools#616 merged. Each caller adds `ready_for_review` and `draft-fast-tier: true`: bootstrap#24 bootstrap-tools#36 cat-harness#450 folio-assistant-core#184 folio-assistant-sci#59 fhir-harness#135 smart-base#136 who-iris#79 smart-ra#90 smart-immunizations#72 smart-immunizations-uganda#11

On each one, the draft run was cancelled when the ready_for_review run started, as designed.

## 2026-10-23: owner "1y 2y" follow-ups

- 1y: cat-harness-tools#629 skips derive:publish and the Chromium install on drafts under draft-fast-tier.
- 2y: folio-assistant#2653 makes merge-main skip draft PRs (no bot merge, no dispatch) and picks them up on `ready_for_review` when labelled.

## Completed (2026-10-24)

All 15 PRs are merged (`litlfred/cat-harness-tools#616`, `litlfred/cat-harness-tools#629`, `litlfred/folio-assistant#2645`, `litlfred/folio-assistant#2653`, and all 11 caller PRs: `bootstrap#24`, `bootstrap-tools#36`, `cat-harness#450`, `folio-assistant-core#184`, `folio-assistant-sci#59`, `fhir-harness#135`, `smart-base#136`, `who-iris#79`, `smart-ra#90`, `smart-immunizations#72`, `smart-immunizations-uganda#11`), with fast-tier-only draft runs followed by full runs on `ready_for_review` verified across the callers.
