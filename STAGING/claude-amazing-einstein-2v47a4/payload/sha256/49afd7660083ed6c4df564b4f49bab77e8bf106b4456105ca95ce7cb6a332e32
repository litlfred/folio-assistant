---
# folio-assistant-cis5
$schema: bean/1.0.0
title: 'CI BOTTLENECK 5: cache ~/.fhir/packages and global fsh-sushi across FHIR IG workflows'
status: completed
type: task
priority: normal
created_at: 2026-10-15T20:27:00Z
updated_at: 2026-10-15T21:05:30Z
parent: folio-assistant-cisp
---

## Problem

In `smart-base`, `smart-immunizations-uganda`, `smart-hiv`, `smart-ra`, and `fhir-harness`, `npm install -g fsh-sushi` and SUSHI's FHIR IG dependency downloads (`~/.fhir/packages`) run uncached when the AST cache misses.

## Remedy

Cache `~/.fhir/packages` and the `fsh-sushi` install directory via `actions/cache` in the FHIR IG build workflows.
