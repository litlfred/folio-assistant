---
# folio-assistant-rhkg
$schema: bean/1.0.0
title: 'Memory: Owner rule 2026-11-10 - folio sites publish on every push to main (site-publish.yml on push + dispatch); documented in merge-to-main Task_Republish'
status: completed
type: task
priority: low
created_at: 2026-11-10T20:32:53Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `site-publish-on-merge.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner rule 2026-11-10 - folio sites publish on every push to main (site-publish.yml on push + dispatch); documented in merge-to-main Task_Republish

Owner, 2026-11-10 20:30Z (thread "Remove left gutter on DTH sites", cmsg_017WNUkNK8kdDziPK58Pv6G9A4FVReTMWQNcJHJWxMVMtd): "once merged github action to publish runs"; "do so both in tools and as documented process".

**Why:** sites stayed stale after merges because `site-publish.yml` was dispatch-only, and the auto-mode safety check blocks an agent from dispatching a publish without a fresh OK (dth-hrh gutter fix sat merged but unpublished).

**How to apply:** a folio's `.github/workflows/site-publish.yml` runs on `push: branches: [main]` + `workflow_dispatch`, `plan: ${{ inputs.plan == true }}`, calling cat-harness-tools `folio-site-publish.yml` pinned to the lock. After a merge, check that run and the live page; don't dispatch by hand. A repo with `site.build` but no workflow gets one from `cat-harness-tools/templates/document/github/workflows/site-publish.yml`.
ALL MERGED 20:56Z 11-10; merge-triggered publishes green on dth-hrh/phc/sc (dth-sc first since 10-31, 21:00Z). PRs (branch claude/site-publish-on-merge): cat-harness-tools#1793 (template), cat-harness#1208 (merge-to-main.md), dth-hrh#111, dth-phc#37, dth-sc#29 (dth-sc had NO publish workflow; last gh-pages 10-31). smart-ra keeps its own 15-min spacing rule. Related: folio-assistant-nbtb, folio-assistant-pbfo.
