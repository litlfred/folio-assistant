---
# folio-assistant-cis4
$schema: bean/1.0.0
title: 'CI BOTTLENECK 4: avoid duplicate full site builds between Code-quality gates and Feature Staging'
status: in-progress
type: task
priority: normal
created_at: 2026-10-15T20:27:00Z
updated_at: 2026-10-15T20:27:00Z
parent: folio-assistant-cisp
---

## Problem

On `folio-assistant` and layer repositories, every PR push triggers both `Code-quality gates` (which builds the QA working copy, publish-time pages, and Jekyll site) and `Feature Staging (GitHub Pages)` (which independently mounts all layers, runs `derive-at-publish`, and builds the site again).

## Remedy

Cache the mounted layers and derived build artifacts across workflows on the same commit, and allow `Feature Staging` to reuse cached layer mounts and skip redundant rebuilds when only `index.config.json` / `index.lock.json` repins occur unless staging is requested.
