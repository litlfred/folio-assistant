---
# folio-assistant-uwxe
$schema: bean/1.0.0
title: 'Memory: Decision tables on document sites are drawn from the .dmn (Q-DMN-1 A): cat-harness-tools#1324, marker, refusal rule, dth-hrh follow-up'
status: completed
type: task
priority: low
created_at: 2026-11-01T20:11:50Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dmn-site-render.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Decision tables on document sites are drawn from the .dmn (Q-DMN-1 A): cat-harness-tools#1324, marker, refusal rule, dth-hrh follow-up


Owner Q-DMN-1 A (2026-11-01 20:02Z): decision-table blocks render from their `.dmn`, like BPMN. Issue cat-harness-tools#1323, PR #1324 MERGED 2026-11-01 ~20:46Z as f5c959d (thread cmsg_017WNUkNK8kdDziPK58Pv6G9SCPuHgBoQbkw5pqvN1sUT8).
- `pipeline/render-dmn-table.ts` uses `loadDecisionTable` + `unreadableExpressions`; `buildDocumentMarkdown` finds the companion (`meta.dmnFile`, else `<root>.dmn`), decision = block `decisionId` or the only one.
- Placed at a `<!-- dmn:table -->` line in the block `.md`, else appended. Refusal = warning + visible note, not a build error.
- Owner wants reader-facing tables, not technical: labels not fact names, plain value chips, When/Then tints, outcomes coloured, block labels shown as titled links (header citations as small ↗ marks). Style ships inline (DMN_TABLE_CSS).
- Rule descriptions are full-width rows under each rule (as a column they made rows huge).
- After merge: dth-hrh re-pins tools and replaces its hand tables with the marker (#83, split thread …P2GGAjGMvE2u8HqJwVqJE8).
- Local preview: mount fa (`.github/mount-from-lock.sh --root .`), copy the DTH into fa/<dir> with symlinks to the mounts, run `folio-assistant-core/scripts/build-document-site.ts --repo . --no-block-actions`.
- GOTCHA (22:50Z): re-pinning a DTH by editing index.config.json without rerunning remote-mount.ts leaves index.lock.json stale. CI mounts the lock, then stage-local remounts mid-run, the code mixes, Tool discovery is empty, and the publish fails with "renderedBy names no discovered Tool node" plus missing visualiser pages. Fix: commit the regenerated lock.
See folio-assistant-v4cn, folio-assistant-7dra.
