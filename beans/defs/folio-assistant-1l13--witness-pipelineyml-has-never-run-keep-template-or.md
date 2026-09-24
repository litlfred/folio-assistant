---
# folio-assistant-1l13
title: witness-pipeline.yml has never run — keep, template, or retire?
status: todo
type: task
created_at: 2026-09-24T06:47:37Z
updated_at: 2026-09-24T06:47:37Z
---

Split from 52dz (2026-09-24). 52dz's owner decisions moved section-title-audit into folio_init templates, but witness-pipeline.yml was not part of that decision and still sits in .github/workflows with ZERO runs all time (measured 2026-09-20), so check:ci-health cannot see it by construction.

## Done when
- [ ] measured: does it run against the platform at all, or only a folio's computations?
- [ ] owner: keep here, move to folio_init templates (paper/), or retire to fsh-guts/
