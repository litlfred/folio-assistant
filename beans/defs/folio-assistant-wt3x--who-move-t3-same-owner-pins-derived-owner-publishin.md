---
# folio-assistant-wt3x
$schema: bean/1.0.0
title: 'WHO move T3: same-owner pins, derived owner, publishing profile (code PRs)'
status: in-progress
type: task
priority: high
created_at: 2026-11-15T19:40:00Z
updated_at: 2026-11-15T19:40:00Z
tags:
    - who-migration
---

Plan step T3 of `/mnt/project-files/who-migration-plan/who-migration-plan.md` (owner Q-WP-1 = A, "proper way", 2026-11-15). Thread: Build owner-aware tooling for WHO move (…4LP89hFRgqUtvWcbaP433v).

## PRs (code only, lower layer first)
- litlfred/cat-harness-tools#2338 (issue #2337): `schemas/kg/repo-owner.ts` (checkoutOwner = CAT_REPO_OWNER, origin, GITHUB_REPOSITORY_OWNER; HARNESS_OWNER + HARNESS_REPOSITORIES); a bare `repository` in index.config.json remote sources and index.lock.json = same-owner, resolved by every reader, written back bare by mount:remote; `bun run cat mount:same-owner [--write] [--keep]` (refuses harness checkouts); `schemas/kg/publishing-profile.ts` + `iri-base:sync` / `iri-base:check` (layer entry `publish {id, stage, profile}`).
- litlfred/smart-base#422 (issue #421): `smart-base/schemas/publishing.json` (stagingRoot `https://{owner}.github.io`, iriRoot WHO staging root, publishedRoot smart.who.int); site-roots.ts reads it, SMART_OWNER derived; ghbuild.yml SMART_OWNER = caller owner + `smart_owner` input; dth-init mints under iriRoot.
- litlfred/fhir-harness#444 (issue #443): lockedMounts resolves same-owner entries; a local layer's repository from the checkout's origin.

## Timing (agreed with merge manager 19:05Z)
Merge in one batch, layer order, BEFORE the pre-who tag; merge manager then runs one re-pin wave.

## Next (T4, per repo, not in these PRs)
1. Re-pin moved layers to their new owner first (who-iris, dth-hrh → `WorldHealthOrganization/...`, absolute).
2. In each content repo (never a harness repo, never smart-immunizations-uganda): `bun run cat mount:same-owner --write`.
3. Add `publish {id, stage: staging, profile: smart-base/schemas/publishing.json}` to its index entry, `bun run cat iri-base:sync`, regenerate KG (content: owner card).
4. uganda: pins name `WorldHealthOrganization/...` explicitly after the move; its IG workflow passes `smart_owner: WorldHealthOrganization` to ghbuild.

## Open follow-ups noticed
- folio-assistant-core `scripts/diig-phases-svg.ts` defaults `libraryBase` to `https://litlfred.github.io/who-iris/library/` (now 404 after the who-iris transfer); should come from who-iris's declaration once W5 lands.
- fhir-harness `stage-ast-sites.ts`, `ingest-ig-releases.ts`, `gen-ig-ast-pages.ts` still read the declaration's `repository` directly; fine while declarations keep it, revisit if T4 drops it.

## Log
_2026-11-15T19:40Z_ — three PRs open as drafts; CI running.
