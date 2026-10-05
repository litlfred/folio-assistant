---
# folio-assistant-blgm
title: 'MERGE PIPELINE TOOLS: merge:train, merge:overlap, merge:leftover replace the steward''s scratch scripts'
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T17:22:14Z
updated_at: 2026-10-02T21:22:55Z
parent: folio-assistant-d33q
---

Owner approved 2026-10-02. Three commands for the merge steward, replacing scratch scripts train.sh / train2.sh / ch-impact.sh / verify.sh.

- merge:train — build a train branch from a base SHA and members (PR numbers or branches): merge-base.ts --no-regen per member, refuse undeclared conflicts, one regen plus check:l1-complete --write, smart-kg-l1 --entry where stale, kg:audit:all:check; merge origin/main taking main's side of generated conflicts; JSON report. Never pushes.
- merge:overlap — conflict prediction input (requirements T3): pairwise authored-path overlap excluding generated paths (from merge-conflict-patterns PATTERNS), shared declarations, cat-harness/ and cat-harness-tools/ impact.
- merge:leftover — landed / not-landed / could-not-determine for a PR after a train.

## Done when
- [ ] three scripts with unit tests on fixtures, package.json scripts, Tool nodes
- [ ] draft PR open, gates green
- [ ] PR body carries a Tools section for the merge-queue skill on claude/merge-pipeline-epic
