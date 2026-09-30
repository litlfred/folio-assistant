---
# folio-assistant-gyoj
title: Library viewer omits 3 of folio-assistant-sci's 4 library items
status: todo
type: bug
created_at: 2026-09-30T09:08:04Z
updated_at: 2026-09-30T09:08:04Z
parent: folio-assistant-4ccr
---

Measured 2026-09-30 while linking methodology sources (bean qgjh). folio-assistant-sci/library/ holds four complete items — arxiv-2406.01940v2, arxiv-2601.22554v1, arxiv-2602.16554v1, milnorlink — each with manifest.jsonld and structure.json. The library projection (cat-harness/docs/assets/library/index.json, written by gen-library-viz.ts) lists only milnorlink for that instance, and its tile says 1 entry. None of the three is in any withheld.json. So the viewer cannot open them, and the three methodology pages citing them (library/arxiv-2602.16554v1, library/arxiv-2601.22554v1, library/arxiv-2406.01940v2) stay unlinked: the qgjh resolver links only what the projection holds. Find why gen-library-viz skips them; library:viz:check reports current, so the generator itself drops them.
