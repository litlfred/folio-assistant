---
# folio-assistant-ymvt
title: 'INDEX.CONFIG.JSON: one root file declares the instantiated harnesses, their sources and which one controls <base>/index.html'
status: in-progress
type: feature
priority: high
created_at: 2026-10-07T22:20:18Z
updated_at: 2026-10-07T22:20:18Z
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
- [ ] `remoteMounts` has moved off `folio-assistant.json`.
- [ ] `index.lock.json` has replaced `folio-assistant.mount-lock.json`, with a legacy read fallback.
- [ ] `instantiatedHarnessNames`, `resolveLandingInstance` and `readHarnessConfig` read the index first.
- [ ] A landing that names an instance the index does not list is an error.
- [ ] The reserved `index` stem is skipped by every root scan, and the five re-implemented scans are folded into one.
- [ ] `check:landing-instance` reports how the index and the root configs agree.
- [ ] `check:index-ignores` and `index-config:migrate:check` are wired into the gates.
- [ ] `init-folio` writes the index.
- [ ] `index-config:migrate` converts the separated repositories (follow-up PRs per repo).
- [ ] Later, per harness: retire `<name>.config.json` files whose content has moved inline.
