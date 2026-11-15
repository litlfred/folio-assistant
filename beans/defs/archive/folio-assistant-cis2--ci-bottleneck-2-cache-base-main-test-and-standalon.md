---
# folio-assistant-cis2
$schema: bean/1.0.0
title: 'CI BOTTLENECK 2: cache base (main) test and standalone ratchet summaries keyed by base SHA in layer-ci'
status: completed
type: task
priority: high
created_at: 2026-10-15T20:27:00Z
updated_at: 2026-10-15T21:05:30Z
parent: folio-assistant-cisp
---

## Problem

In `cat-harness`, `cat-harness-tools`, `folio-assistant-core`, `fhir-harness`, `who-iris`, etc., every PR push runs four full test jobs (`bun test (head)`, `bun test (base)`, `standalone (head)`, `standalone (base)`), re-measuring the unchanged `base` commit from scratch on every push.

## Remedy

Cache the `base` JSON ratchet output (`base.json` / `standalone-base.json`) via `actions/cache` keyed on the base commit SHA (`ratchet-base-<repo>-<base_sha>`). When cached, skip the `bun install` + full `bun test` / `standalone` execution in the base job and emit the cached summary directly.
