---
# folio-assistant-qgjh
title: References are shown as plain text, not links
status: todo
type: bug
tags:
    - wireframe-findings
    - ui
    - cross-cutting
created_at: 2026-09-23T10:36:13Z
updated_at: 2026-09-23T10:36:13Z
parent: folio-assistant-4ccr
---

Slugs, file names, skills and related nodes are printed as code or plain text although the target exists, so the relationship a page exists to show cannot be followed. Emit links wherever the target resolves.

Observed on: `catalogue`, `external-schemas`, `folio`, `glossary`, `library`, `methodologies`, `processes`, `tools`, `voices` (see each `cat-harness/docs/wireframes/<kind>/intent.md`). Per-page detail is in each visualiser's task under the epic.
