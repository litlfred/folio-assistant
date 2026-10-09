---
$schema: folio-fsh-guts/v1
title: "The five root <name>.config.json files, retired when index.config.json became the checkout's one index"
kind: retired-configs
movedOn: 2026-10-08
movedFrom: "{bootstrap,cat-harness,smart-base,smart-trust,who-iris}.config.json at the repository root"
issue: 2486
summary: >-
  The per-instance config files the root used to carry, kept beside this note
  under configs/. Their attributes were inlined into index.config.json
  (litlfred/folio-assistant#2486), which made them obsolete. Front matter added
  2026-10-09: the note reached this branch without it and failed
  fsh-guts-not-rendered.test.ts (litlfred/folio-assistant#2518).
---

# Legacy Root Configs Retirement

## What was retired

The following 5 individual `<name>.config.json` files were retired from the repository root to `fsh-guts/retired/configs/`:
- `bootstrap.config.json`
- `cat-harness.config.json`
- `smart-base.config.json`
- `smart-trust.config.json`
- `who-iris.config.json`

## Why

Per owner direction (2026-10-07, 2026-10-08):
`index.config.json` is now the single authoritative index for all instantiated harnesses in this checkout.
Previously, instantiated harnesses were discovered by scanning the root for `*.config.json`.
Now, `index.config.json` lists all instances, their source (local vs remote mount), and their effective configuration.
The configuration attributes from these files (`contentType: "document"`, `feedbackDir: ".folio-feedback"`, `skills: ".claude/skills/local"`) have been inlined directly into `index.config.json` for their respective instances, making the individual root `.config.json` files obsolete and allowing root clutter to be cleaned up.
