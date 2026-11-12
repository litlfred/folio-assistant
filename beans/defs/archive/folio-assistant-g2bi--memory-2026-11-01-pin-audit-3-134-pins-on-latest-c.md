---
# folio-assistant-g2bi
$schema: bean/1.0.0
title: 'Memory: 2026-11-01 pin audit (3/134 pins on latest), chain re-pin tool plan (repin:cone), and the "Guideline Updates" process (people + technical); Q-PIN-1/2'
status: completed
type: task
priority: low
created_at: 2026-11-01T16:58:05Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `chain-repin-guideline-updates.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-01 pin audit (3/134 pins on latest), chain re-pin tool plan (repin:cone), and the "Guideline Updates" process (people + technical); Q-PIN-1/2


Thread "Re-pin along the dependency chain and document Guideline Updates" (cmsg_017WNUkNK8kdDziPK58Pv6G9PoV9XVTAnNK2LLT4uX1uTK), started 2026-11-01 16:55Z.

- Audit 17:00Z (read-only): 3 of 134 pins on latest across 19 sites with index.lock.json. Table in /mnt/project-files/pin-check-2026-11-01/pins.md. Method: raw.githubusercontent index.lock.json per litlfred site + blobless bare clones of each dependency, `rev-list --count pin..main` (gh REST is blocked for repos not attached; raw + git clone work).
- Existing tooling: cat-harness-tools .github/workflows/standing-repin.yml + scripts/repin-standing.ts (one site, trust.standing); fa repin-train.yml (see folio-assistant-ufn8). No site declares trust.standing on main; only fa has a train. Nothing models the downstream chain.
- User (16:55-16:57Z): re-pin a lot in rapid dev; re-pins are ALSO a review step (a country adopting a new WHO guideline version compares old vs new guideline vs its adaptations, decides impact and which adaptations to revise). Document as process "Guideline Updates", covering both people/stakeholder/policy and technical sides.
- Q-PIN-1 (tool shape; A = `repin:cone` in cat-harness-tools: chain order, layer-by-layer PRs, old-vs-new impact report on adaptations), Q-PIN-2 (location; A = folio-assistant-core processes/content/guideline-updates.bpmn). Posted 17:0xZ, both A recommended; working on A/A as drafts. Ask before merging tooling.
- 17:00Z Q-PIN-1 A and Q-PIN-2 A tapped. Built: cat-harness-tools draft #1302 (issue #1301, branch claude/repin-cone, 799164c): scripts/repin-cone.ts + test, `mount:repin:cone --fleet <json|list> --changed <repo> [--impact] [--dispatch] [--via git]`. core draft #500 (branch claude/guideline-updates, 5279df6): processes/content/guideline-updates.bpmn + checklist + .pot. Both subscribed. Q-PIN-3 (merge: A both on green) posted ~17:35Z.
- Local check recipe: fa clone + mount-from-lock.sh + swap in branch dirs + bun install; run bpmn-detangle / render-bpmn / bpmn-checklist / translate-bpmn --instance ./folio-assistant-core --extract (they rewrite other files: copy only your own).
- 17:21Z Q-PIN-3 A tapped (owner's own tap): both marked ready (ccr/ready_for_review), tools#1302 branch updated; merge each on green.
- 18:02Z tools#1302 MERGED e56826f (squash; repo usually uses merge commits). core#500 full CI running. Sites need a tools re-pin to get mount:repin:cone.
- 19:35Z core#500 MERGED bd56d01. Thread done. Follow-up (not started): sites need tools/core re-pins to get repin:cone + the process; optional: owner standing consent per site so --dispatch moves pins.
