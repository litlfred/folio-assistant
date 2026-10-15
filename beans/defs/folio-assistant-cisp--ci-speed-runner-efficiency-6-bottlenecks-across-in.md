---
# folio-assistant-cisp
$schema: bean/1.0.0
title: 'CI SPEED & RUNNER EFFICIENCY: 6 bottlenecks across index, layer PR checks, staging and FHIR IG builds'
status: in-progress
type: epic
priority: high
created_at: 2026-10-15T20:27:00Z
updated_at: 2026-10-15T20:27:00Z
parent: folio-assistant-rwmf
---

## Context

Measured across `folio-assistant`, `cat-harness-tools`, `cat-harness`, and the `smart-*` / `fhir-harness` repositories on 2026-10-15: six bottlenecks dominate CI wall-clock time and concurrent runner consumption:

1. **`folio-assistant-cis1`** — Serial critical path in `folio-assistant` (`QA working copy` → `Publish-time pages` → downstream shards) and uncached 11-layer fetches in `mount-from-lock`.
2. **`folio-assistant-cis2`** — Running `bun test (base)` and `standalone (base)` from scratch on every PR push in `layer-ci.yml` instead of caching base ratchet summaries keyed by `base.sha`.
3. **`folio-assistant-cis3`** — Orphaned `in_progress`/`queued` runs on closed/merged PRs starving the org runner pool.
4. **`folio-assistant-cis4`** — Duplicate full site builds between `Code-quality gates` and `Feature Staging (GitHub Pages)` on every PR push.
5. **`folio-assistant-cis5`** — Uncached `~/.fhir/packages` and global `fsh-sushi` installs across `smart-*` / `fhir-harness` IG workflows.
6. **`folio-assistant-cis6`** — Sequential `tsc --noEmit` invocations in `typecheck:instances`.
