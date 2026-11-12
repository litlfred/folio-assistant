---
# folio-assistant-fvm7
$schema: bean/1.0.0
title: 'Memory: fa#2864 bun test shards 3 (declared-path literals) and 4 (uncited e0jh papers) fixes, PRs and the awaitingCitation field, 2026-11-01'
status: completed
type: task
priority: low
created_at: 2026-11-01T10:42:33Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `fa-2864-shards-3-4.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: fa#2864 bun test shards 3 (declared-path literals) and 4 (uncited e0jh papers) fixes, PRs and the awaitingCitation field, 2026-11-01


Thread "Fix DMN and paper test failures" (cmsg_017WNUkNK8kdDziPK58Pv6G924p1uVUAguhmKGcVStAe6o), 2026-11-01.
- Shard 3: declared-paths ratchet. dmn-check.ts "folio/" literal and (on tools main) site-dead-links.ts "docs/" literal. Fixed in cat-harness-tools#1254 (issue #1253).
- Shard 4: core schemas/library-ref.test.ts forbids uncited platform library entries; 25 e0jh BPMN/DMN papers uncited. `heldEntries` is WRONG for this: it also holds summaries back (9 papers have text blocks; block-summaries backlog test then fails). New field `awaitingCitation` (schema in tools#1254, list in cat-harness#903 issue #902, test reads it in core#484 issue #483).
- MERGED 11:16-11:38Z: tools#1254 6934ab2, core#484 cf9d486, cat-harness#903 fcc1534; shas relayed to S1 for the fa#2864 re-pin.
- Q-CITE1 answered A (awaiting-citation list) 10:45Z; user extended the functional merge window to 13:37Z (cmsg_017WNUkNK8kdDziPK58Pv6G9T63Q7iC6qBPZ9uCoXPvHr7), so all three merge on green.
See folio-assistant-wmmg, folio-assistant-zkjy.
- Q-ING1 (user 10:46Z "B + C but only if worthwhile; else drop"): content PR cat-harness#913 (issue #912, draft, stacked on #903) cites 14 papers (new methodology process-model-quality + dmn) and drops 11. No openly licensed copies exist for the 16 copyrighted ones. Needs user review; never merge in a window.
- dmn-check.ts literal left to S1's tools#1238 (marker); tools#1254 now = site-dead-links marker + awaitingCitation field. Asked S1 (via coordinator) to drop cat-harness#891 (heldEntries breaks block-summaries backlog test).
- Q-CITE2 A (21:23Z): user OK'd merging content PR cat-harness#913 once green (merged main at ab8f679e).
- cat-harness#913 MERGED 2026-11-02 02:40Z (075a98d); issue #912 closed. Thread work complete.
