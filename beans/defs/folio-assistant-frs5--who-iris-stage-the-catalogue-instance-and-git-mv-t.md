---
# folio-assistant-frs5
title: who-iris/ — stage the catalogue instance, and git mv the three WHO library entries into it
status: todo
type: task
priority: high
created_at: 2026-09-20T08:02:32Z
updated_at: 2026-09-20T08:02:32Z
parent: folio-assistant-kupb
---

Owner, 2026-09-20: two staged top-level dirs, and 'git mv all three now, re-wire consumers in the same PR'.

THE THREE ARE ALL IRIS ITEMS, which is what makes the catalogue the right home rather than a style-guide repo: `wpr-rdo-2020-003-eng`, `who-pub-tps-931`, `9789241548960-eng`. `milnorlink` is NOT, and does not move here — bean `r1lz` sends it to `folio-asst-sci` as the source text for the derived milnor skill.

SIZE, measured in `r1lz` on 2026-09-19: the three WHO documents are 1,339 of 1,402 tracked library files; milnorlink is the remaining 62.

CONSUMERS THAT MOVE WITH THE FILES, the eight `r1lz` lists: `adapters/mcp-server/paths.ts`, `server.ts`, `tools/graph.ts`, `content/docs/document-ingestion`, `content/docs/evidence`, `content/pipeline/gen-block-jsonld.ts`, `gen-library-jsonld.ts`, `graph-index.ts` — plus `scripts/tests/qa-checkers-voice.test.ts`, which names a slug directly.

OCR STAYS. Owner, 2026-09-20: 'keep OCR as platform tool of cat-harness.' The PIPELINE is platform; only the CONTENT moves. `who-pub-tps-931` is the only scanned entry and the only one exercising the OCR path, so what the platform keeps as a fixture is a real question and is deliberately NOT answered by this bean — see the roast.

DO NOT leave `library/` declared and empty in cat-harness. That is the `dh4f` defect exactly: a consumer scans nothing and reports a clean run over it. The declaration moves with the content or it goes.
