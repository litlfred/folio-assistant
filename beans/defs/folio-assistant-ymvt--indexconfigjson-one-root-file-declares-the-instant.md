---
# folio-assistant-ymvt
title: 'INDEX.CONFIG.JSON: one root file declares the instantiated harnesses, their sources and which one controls <base>/index.html'
status: in-progress
type: feature
priority: high
created_at: 2026-10-07T22:20:18Z
updated_at: 2026-10-09T17:43:06Z
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

- [ ] Root `index.config.json` lists every instantiated harness, with `site.landing: "cat-harness"`.
- [x] `remoteMounts` has moved off `folio-assistant.json`.
- [x] `index.lock.json` has replaced `folio-assistant.mount-lock.json`, with a legacy read fallback.
- [ ] `instantiatedHarnessNames`, `resolveLandingInstance` and `readHarnessConfig` read the index first.
- [x] A landing that names an instance the index does not list is an error.
- [ ] The reserved `index` stem is skipped by every root scan, and the five re-implemented scans are folded into one.
- [x] `check:landing-instance` reports how the index and the root configs agree.
- [x] `check:index-ignores` and `index-config:migrate:check` are wired into the gates.
- [x] `init-folio` writes the index.
- [ ] `index-config:migrate` converts the separated repositories (follow-up PRs per repo).
- [ ] Later, per harness: retire `<name>.config.json` files whose content has moved inline.

## State 2026-10-09 (re-measured in the index checkout at 28283d2b9f)
Ticked above, each on a measurement:
- `folio-assistant.json` and `folio-assistant.mount-lock.json` are absent at the root; `index.lock.json` is the lock, and `cat-harness/schemas/git-corpus.ts:181` still reads a legacy `*.mount-lock.json` ("`index.lock.json`, else the legacy …; both is a conflict").
- `index-config.ts:170` refuses a `site.landing` naming an unlisted instance; `harness-config.ts` reads `readIndexConfig` first (lines 844, 906) and treats an undecidable index as `invalid`, never a fallback.
- `bun run cat check:landing-instance` → "✓ / is folio-assistant-core's landing … ✓ every root config is listed, and every import exists"; `check:index-ignores` → ✓; `index-config:migrate:check` → "✓ index.config.json is current". All three run in `code-quality-gates.yml` (lines 3224–3237).
- `init-folio.ts` writes `index.config.json` (line 1373, one local instance).
Still open:
- **Box 1:** all 11 instances are listed, but `site.landing` is **`folio-assistant-core`**, not the `cat-harness` this box names (set in commit 3d4caf6e, 2026-10-08). Either the box is amended to the current landing or the landing changes back — the owner's call; nothing records which.
- **Box 4:** `readHarnessConfig`'s path is verified; `instantiatedHarnessNames` and `resolveLandingInstance` were not individually re-read.
- **Box 6** (reserved `index` stem; five scans folded into one): not measured.
- **Box 10:** at their current pins, cat-harness, cat-harness-tools, folio-assistant-core, folio-assistant-sci, fhir-harness, who-iris and bootstrap-tools carry an `index.config.json`; **smart-base, smart-trust, smart-immunizations and bootstrap do not**.
- **Box 11:** later, by design.
Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.
