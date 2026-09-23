---
# folio-assistant-4ccr
title: 'WIREFRAME FINDINGS: usability and accessibility defects the as-is wireframes observed (#1023)'
status: todo
type: epic
tags:
    - wireframe-findings
    - ui
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-23T10:36:13Z
---

The as-is wireframes merged in #1032 record, for every declared harness visualiser, what the page actually does at 1280×800 (web) and 390×844 (mobile). The `## Findings` section of each `cat-harness/docs/wireframes/<kind>/intent.md` holds only what was observed on the rendered page or read off its generator; nothing is inferred.

This epic turns those findings into work (owner, 2026-09-23: *"make the findings into beans"*):
- one **cross-cutting** bug per defect that recurs across pages, so it is fixed once, in the shared template or CSS;
- one task per **visualiser**, holding that page's findings verbatim, each tagged with the cross-cutting bug that covers it.

It belongs to the rendered-surface stream, `folio-assistant-10uc` (navbar, visualisers, stickies).

Fixing a finding means changing the generator or the shared chrome, then re-drawing that visualiser's wireframe, so that `check:wireframes` and the wireframe stay the record of the page as it is.
