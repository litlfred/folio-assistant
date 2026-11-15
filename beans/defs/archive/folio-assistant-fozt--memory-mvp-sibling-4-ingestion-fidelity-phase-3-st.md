---
# folio-assistant-fozt
$schema: bean/1.0.0
title: 'Memory: MVP sibling #4 (ingestion fidelity, Phase 3) state 2026-11-01: dth-phc#27 who-iris repin, ls3t in smart-base#249, card Q-ING-1'
status: completed
type: task
priority: low
created_at: 2026-11-01T21:38:26Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ingestion-fidelity-mvp4.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: MVP sibling #4 (ingestion fidelity, Phase 3) state 2026-11-01: dth-phc#27 who-iris repin, ls3t in smart-base#249, card Q-ING-1


Thread "Improve ingestion fidelity" (cmsg_017WNUkNK8kdDziPK58Pv6G9LnoPRa25ZYzu5ytUuSZAdT), brief §4 of /mnt/project-files/mvp-freeze-2026-11-01/sibling-briefs.md.

- who-iris#157 closed by #161 (owner merged 2026-11-01 21:18Z, who-iris main 60040aa).
- dth-phc#27 re-pins who-iris 7314adf -> 60040aa (non-content); figure:coverage 15 declared, 0 missing. Merge on green.
- dth-phc#5 is fixed by dth-phc#7 (cysv thread), not by this thread.
- DONE 2026-11-02 08:00Z: dth-phc#27 merged 17b081b; smart-base#244 60250de, #249 e4e4ee1 (owner); cat-harness-tools#1362 61400ac; bean ls3t closed.
- Gotcha: smart-base PR gates run inside a folio-assistant checkout at FA's pins, so a tools fix reaches smart-base CI only after an fa re-pin (train), not a smart-base re-pin.
- Repin in a DTH: edit ref + consent evidence in index.config.json, then `bun run cat-harness-tools/scripts/remote-mount.ts` regenerates index.lock.json (mount first with .claude/hooks/session-start.sh).

See folio-assistant-aqrb, folio-assistant-7dra.
