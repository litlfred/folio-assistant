---
# folio-assistant-ymvt
$schema: bean/1.0.0
title: 'INDEX.CONFIG.JSON: one root file declares the instantiated harnesses, their sources and which one controls <base>/index.html'
status: completed
type: feature
priority: high
created_at: 2026-10-07T22:20:18Z
updated_at: 2026-10-22T16:49:00Z
parent: folio-assistant-7x5n
---

## The owner's decision (2026-10-07)

> migration to index.config.json importing <harness>.config.json information as needed

Then, the same evening: *"go ahead and start the migration NOW to index.config.json, /coordinate as needed"*.

Issue #2483. Proposal `cat-harness/docs/proposals/index-config.md`. Skill `index-config`.

## What it is

A root `index.config.json` (`folio-index-config/v1`) declares:
- which harnesses the checkout instantiates;
- where each one comes from: local `at`, or `remote` (a `remoteMounts` entry without `harness`);
- each one's config: the imported `<name>.config.json`, overlaid by inline fields;
- which harness controls `<base>/index.html` (`site.landing`: an instance name or `hub`).

When the file is present it is authoritative. When it is absent, today's behaviour is unchanged.

## Related

- `1yd7`: landing stickies live with their own instance. `gen-landing-data` now picks the landing instance through `resolveLandingInstance` instead of its own location, so moving the stickies stays a separate, unblocked step.
- `t4xb`: mount path and route collisions. The generated `.gitignore` block lists every mount path the index and the lock name. A route-namespacing decision would read the same index.
- #2468 (`track`, `mount:update`, consent) routes its mount writes through `writeDeclaredMounts`.

## Done when

- [x] Root `index.config.json` lists every instantiated harness, with `site.landing: "cat-harness"` initially on 2026-10-07 and updated to `"folio-assistant-core"` by the owner in commit `3d4caf6e0f` (`2026-10-08`, when the root `folio-assistant` declaration was removed).
- [x] `remoteMounts` has moved off `folio-assistant.json`.
- [x] `index.lock.json` has replaced `folio-assistant.mount-lock.json`, with a legacy read fallback.
- [x] `instantiatedHarnessNames`, `resolveLandingInstance` and `readHarnessConfig` read the index first (`cat-harness/schemas/harness-config.ts:697-805`, `861-866`, `923-955`).
- [x] A landing that names an instance the index does not list is an error.
- [x] The reserved `index` stem is skipped by every root scan, and the five re-implemented scans are folded into one (`cat-harness/schemas/instance-roots.ts:350-405`: `RESERVED_INSTANCE_NAMES = ["index"]`, `rootConfigStems`, `isReservedIndexFile`).
- [x] `check:landing-instance` reports how the index and the root configs agree.
- [x] `check:index-ignores` and `index-config:migrate:check` are wired into the gates.
- [x] `init-folio` writes the index.
- [x] `index-config:migrate` converts the separated repositories (follow-up PRs per repo — completed across `bootstrap`, `bootstrap-tools`, `cat-harness`, `cat-harness-tools`, `folio-assistant-core`, `folio-assistant-sci`, `fhir-harness`, `who-iris`, `smart-base`, `smart-trust`, `smart-immunizations`, `smart-immunizations-uganda`, `smart-hiv`, `smart-ra`, `ihris`, `smart-ig`, `smart-ips-pilgrimage`, `smart-trust-ph4h`, `smart-dak-ecare`).
- [x] Later, per harness: retire `<name>.config.json` files whose content has moved inline (verified 0 legacy `<name>.config.json` files across all 11 mounted repositories; `bun run cat check:landing-instance` reports `legacy <name>.config.json: none — every instance is configured inline in index.config.json`).

## State 2026-10-09 (re-measured in the index checkout at 28283d2b9f; updated 2026-10-16 and completed 2026-10-22)
Ticked above, each on a measurement:
- `folio-assistant.json` and `folio-assistant.mount-lock.json` are absent at the root; `index.lock.json` is the lock, and `cat-harness/schemas/git-corpus.ts:181` still reads a legacy `*.mount-lock.json` ("`index.lock.json`, else the legacy …; both is a conflict").
- `index-config.ts:170` refuses a `site.landing` naming an unlisted instance; `harness-config.ts` reads `readIndexConfig` first (`readHarnessConfig` lines 697–805, `instantiatedHarnessNames` lines 861–866, `resolveLandingInstance` lines 923–955) and treats an undecidable index as `invalid`, never a fallback.
- `instance-roots.ts:350-405` defines `RESERVED_INSTANCE_NAMES = ["index"]`, `rootConfigStems` (the single root scan folding the five re-implemented scans), and `isReservedIndexFile`.
- `bun run cat check:landing-instance` → "✓ / is folio-assistant-core's landing … ✓ every root config is listed, and every import exists … legacy <name>.config.json: none — every instance is configured inline in index.config.json"; `check:index-ignores` → ✓; `index-config:migrate:check` → "✓ index.config.json is current". All three run in `code-quality-gates.yml` (lines 3224–3237).
- `init-folio.ts` writes `index.config.json` (line 1373, one local instance).
- Every separated repository now carries `index.config.json` (`bootstrap#19`, `smart-base#97`, `smart-trust#54`, `smart-immunizations#54`, `smart-immunizations-uganda#35`, `smart-hiv#6`, `smart-ra#11`, `ihris#2`, `smart-ig#1`, `smart-ips-pilgrimage#1`, `smart-trust-ph4h#1`, `smart-dak-ecare#1`, plus `bootstrap-tools`, `cat-harness`, `cat-harness-tools`, `folio-assistant-core`, `folio-assistant-sci`, `fhir-harness`, `who-iris`), and all legacy `<name>.config.json` files have been retired (`smart-trust` retired the last one in `f181a8fcc9`).
- **Box 1 & Box 11:** `site.landing` was originally `"cat-harness"` on 2026-10-07 and updated to `"folio-assistant-core"` by the owner in commit `3d4caf6e0f` (`2026-10-08`); all legacy `<name>.config.json` files are retired (`check:landing-instance` passes).
Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
