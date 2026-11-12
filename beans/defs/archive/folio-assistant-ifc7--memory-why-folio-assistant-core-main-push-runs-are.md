---
# folio-assistant-ifc7
$schema: bean/1.0.0
title: 'Memory: Why folio-assistant-core main push runs are red (42 lower-layer gates in the mounted index), the 10 fixing PRs, Q-CMR-1/2/3, and how to reproduce CI''...'
status: completed
type: task
priority: low
created_at: 2026-11-01T17:23:58Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `core-main-red-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Why folio-assistant-core main push runs are red (42 lower-layer gates in the mounted index), the 10 fixing PRs, Q-CMR-1/2/3, and how to reproduce CI's index locally


Thread "Fix core main record runs" (cmsg_017WNUkNK8kdDziPK58Pv6G93hPPrepUo5bjTf4aT8PZGd), 2026-11-01.

- Core main push runs are red only through main-qa: 42 red gates, all lower-layer, in the mounted fa index (core#287). Core PRs ALREADY reuse main's answer (exact cache key).
- Q-CMR-1 A: took over core#432 (main-qa-gates.json). Q-CMR-2 A then the user wrote "then all": fix every gate. Tracker cat-harness-tools#1299.
- PRs (merge on green, window extended by user 17:27Z to 20:27Z, cmsg_017WNUkNK8kdDziPK58Pv6G9NvMGGKmpGA95ekCsPZLSdn): core#432, core#495 (checklists, dth-init marker, library nodes, graphNode tags), tools#1300 (run-gates skips: live/runner/needs-input/layer-mode, incl. bootstrap-tools committed-tree gates), tools#1303 (library nodes), tools#1304 (graphNode tags, artefact declarations, parity EXEMPT, reference-direction PENDING, held-copy markers), cat-harness#924 (kind schemas, keywords, .pot), who-iris#159 (keywords), bootstrap-tools#64 (/dev/null export), smart-base#271 (graphNode).
- Q-CMR-3 A (17:25Z): state branches DONE 17:35Z (fa cat/cat-harness/{beans,todos,issue-marks,health,qa-reports,subscribed-harnesses,merge-reviews}); then 8 standalone tests, split baseline, file big items on tools#1299. S1 thread's core#497 deletes dth-init.ts and templates/dth.
- Repro CI index: clone folio-assistant to /tmp/fa, `bash fa/.github/mount-from-lock.sh --root fa`, replace layers with `git archive origin/main`, root-cat-script.py, bun install. Gates: `bun run cat <gate>`. Index mounts are untracked, so gates reading the COMMITTED tree (bootstrap-tools readmes etc.) see empty dirs. Running as root hides EACCES bugs.
- Editing a PR this session didn't open was blocked by the auto-mode classifier until the user picked takeover on a card. See folio-assistant-cq1k.
- 20:25Z: 11 of 12 merged (incl. tools#1306 split+standalone baseline, #1320 skip other layers' standalone in MODE=layer). Q-CMR-4 A (smart-base#271 merged). Q-CMR-5 A via user's 19:36Z +6hr window: merge core#495, extend standalone skip to index mode (smart-ra#213 runs MODE index), regen cat-harness archimate schema. CI render difference recorded on tools#1299 (needs CI diagnostic).
