---
# folio-assistant-v433
title: 'DOCUMENT SITE: load block content dynamically from the published graph instead of one multi-MB page (owner: ''dynamic JS load of KG, as should of rest of content'')'
status: in-progress
type: feature
priority: high
created_at: 2026-10-06T20:28:26Z
updated_at: 2026-10-06T20:28:26Z
parent: folio-assistant-q4jm
---

Owner, 2026-10-06, after the DPI-H page (933 blocks, 2.3 MB HTML) was heavy to load: 'that can be dynamic JS load of KG, as should of rest of content', then 'Start building it now on this branch.'

Design: the document page becomes a SHELL (headings, block anchors, block actions, comment notes) and each block's rendered HTML is published as data, one JSON per chapter, loaded when it nears the viewport and then the rest in idle time. A full page stays published for file://, no-JS readers, search engines and the review tools.

## Done when
- [ ] build-document-site writes the shell, per-chapter block JSON and the full page
- [ ] blocks near the viewport load first; a #block link loads its chapter and lands on it
- [ ] file:// and fetch failures fall back to the full page
- [ ] tools that read or picture the document page still get the full content
- [ ] measured before/after on smart-ra (page size, longest task)
- [ ] skill and tests updated
