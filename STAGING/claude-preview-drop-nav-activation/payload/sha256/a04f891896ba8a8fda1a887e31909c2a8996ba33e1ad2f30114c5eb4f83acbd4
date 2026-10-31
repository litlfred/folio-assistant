---
# folio-assistant-cis1
$schema: bean/1.0.0
title: 'CI BOTTLENECK 1: cache mounted layer trees in mount-from-lock and decouple static gates from Publish-time pages'
status: completed
type: task
priority: high
created_at: 2026-10-15T20:27:00Z
updated_at: 2026-10-15T21:05:30Z
parent: folio-assistant-cisp
---

## Problem

1. `.github/mount-from-lock.sh` / `scripts/mount-from-lock.ts` fetches all 11 layer repositories sequentially from GitHub in every job (~15 jobs per workflow run).
2. In `folio-assistant` `code-quality-gates.yml`, static repository gates and unit tests wait for `QA working copy` (~3–4 min) and `Publish-time pages` (~2–3 min) sequentially before starting.

## Remedy

- Support a local content-addressed mount cache directory (`CAT_MOUNT_CACHE_DIR` / `~/.cache/cat-mount/<treeDigest>`) in `scripts/mount-from-lock.ts`, verified by `digestOf(dst).treeDigest === d.treeDigest`, and cache `~/.cache/cat-mount` in CI keyed by `hashFiles('index.lock.json')`.
- Decouple static repository gates that do not read publish-time site output from `Publish-time pages`.
