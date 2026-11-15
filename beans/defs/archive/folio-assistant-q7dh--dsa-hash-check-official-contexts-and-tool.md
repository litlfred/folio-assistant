---
# folio-assistant-q7dh
$schema: bean/1.0.0
title: 'check:dsa-hash: validate against official ODRL/DCAT/DCMI contexts, declare it as a Tool'
status: completed
type: task
priority: normal
created_at: 2026-10-30T20:40:00Z
updated_at: 2026-10-31T20:26:05Z
parent: folio-assistant-negd
---

Follow-up to bean `2z1t` (litlfred/folio-assistant-core#249, merged 2026-10-30 20:30Z). Issue: litlfred/folio-assistant#2702.

## What is left
1. `folio-assistant-core` `check-dsa-hash.ts` checks field names against hand-written lists of ODRL 2.2, DCAT 3 and DCMI Terms. Bean `2z1t` said to validate against the official published JSON-LD contexts, never a hand-written copy. Vendor (pinned, hashed) or load the official contexts and check against them.
2. `kg:audit` reports `activity-skill-has-tool` on the four DSA steps: no Tool declares it satisfies the `dsa-*` skills. Declare a `check-dsa-hash` Tool that does.
3. `kg:audit` reports `skill-voice-review-current` on the four new `dsa-*` skills: run the voice review.

## Done when
- The term check reads only official contexts; a made-up term fails it.
- `kg:audit` shows neither finding for the DSA steps and skills.
- No new schema fields are invented.

_2026-10-30T21:24:15Z_ — Claimed by agy (`44190586-6f7e-4f91-bace-14f09541fa6a`).

_2026-10-30T23:30:30Z_ — Opened PRs (merge window elapsed, left open for review):
- `litlfred/folio-assistant-core`: https://github.com/litlfred/folio-assistant-core/pull/303 (official SHA-256-pinned ODRL 2.2 / DCAT 3 / SPDX 2.2.2 / DCMI Metadata Terms contexts in `check-dsa-hash.ts`, `check-dsa-hash` Tool declaration, updated `kg-qa` sidecars)
- `litlfred/cat-harness`: https://github.com/litlfred/cat-harness/pull/818 (`agent-skill-authoring` voice review attestations for the four `dsa-*` skills)
- `litlfred/cat-harness-tools`: https://github.com/litlfred/cat-harness-tools/pull/1034 (`skillVoices` fallback to `HARNESS_ROOT` in index checkouts)

_2026-10-31T02:56:00Z_ — Merged latest `origin/main` into all 3 open PRs (and updated `glossary/generated/folio-assistant-core/kg-tools.glossary.json` with `check-dsa-hash` in `folio-assistant-core#303`); all CI checks are now green across all 3 PRs (left open for review, not merged):
- `litlfred/folio-assistant-core#303` (`63f8f6e`): 11/11 checks passing (`No new failures (tests and gates)`, `Prepare the PR side (and typecheck)`, all 4 base/head shards)
- `litlfred/cat-harness#818` (`ba8872f2`): 7/7 checks passing (`No new failures (tests and gates)`, `Prepare the PR side (and typecheck)`, all 4 head shards)
- `litlfred/cat-harness-tools#1034` (`8d7d2cd`): 9/9 checks passing (`Typecheck`, `Tests (no new failures)`, `Index gates (no new failures)`, `Standalone (no new failures)`, `bun test` base/head, `standalone` base/head)

_2026-10-31T20:26:05Z_ — All fix PRs merged (owner card choice A, 2026-10-31 20:22Z, thread "Drain workplan, issues and beans"); bean completed.
