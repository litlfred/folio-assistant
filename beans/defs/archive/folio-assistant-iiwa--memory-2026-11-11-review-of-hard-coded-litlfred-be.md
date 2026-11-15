---
# folio-assistant-iiwa
$schema: bean/1.0.0
title: 'Memory: 2026-11-11 review of hard-coded "litlfred" before moving smart-*/dth-* repos to WHO; report path, key findings, open cards Q-MIG-1/2'
status: completed
type: task
priority: low
created_at: 2026-11-11T16:07:54Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-migration-hardcode-review.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 2026-11-11 review of hard-coded "litlfred" before moving smart-*/dth-* repos to WHO; report path, key findings, open cards Q-MIG-1/2

Thread "Prepare repos for WHO migration" (cmsg_017WNUkNK8kdDziPK58Pv6G9AUsbwQds8zeTj52BZYspkj), 2026-11-11.

- Scope (user 15:59Z): smart-* and dth-* repos move to WHO; harness repos (cat-harness*, fhir-harness, folio-assistant*, bootstrap*, who-iris) stay at litlfred.
- Report: /mnt/project-files/who-migration-2026-11-11/litlfred-hardcode-review.md
- WHO already has same-named repos (WorldHealthOrganization/smart-base …), so no GitHub redirects: everything must be rewritten/derived.
- Must-fix code: cat-harness-tools scripts/workflow-pins.ts (const OWNER="litlfred", regex), layer-pr-checks.yml / layer-main-qa.yml ("litlfred/$r" loops), needs-at-main.ts, site-publish-caller.ts, init-folio.ts; smart-base ghbuild.yml SMART_BASE_REPO, themes.ts, dth-init.ts, check-l2-dth.ts, terminology-lookup.ts; uganda canonical is litlfred.github.io.
- Leave: npm scope @litlfred (workspace names only), trust "by"/evidence provenance, .github/layers-url (folio-assistant stays).
- iriBase in <repo>.json is the single IRI source; ~12.1k generated IRIs under migrating sites.
- Risks: WHO gh-pages already hold IG CI builds; WHO Actions policy may block litlfred/* reusable workflows; secrets DAK_LLM_API_KEY, WEBLATE/CROWDIN/LAUNCHPAD tokens.
- Q-MIG-1 = A (16:09Z): draft PRs now in cat-harness-tools + smart-base (branch claude/owner-from-lock); workflow edits handed to user as patch. Q-MIG-2 = A (16:09Z): iriBase -> worldhealthorganization.github.io/<repo>/ at migration time, then regenerate KG.
- User 16:10Z: staging = worldhealthorganization.github.io/<repo>/; once published, IRIs/sites move to smart.who.int. Keep staging root and published root as two separate settings.
- Q-MIG-3 = B (16:15Z): IRIs on staging root (WHO github.io) now; scripted rewrite to smart.who.int at publish (staging-changes foldBase is the existing rewrite helper). cat-harness-tools#1918 draft (issue #1917): owner from lock. Workflow patch in Library who-migration-2026-11-11/.
- PRs (draft, 16:2xZ): cat-harness-tools#1918 (issue #1917), smart-base#351 (issue #350, new smart-base/schemas/site-roots.ts: SMART_OWNER, STAGING_ROOT, PUBLISHED_ROOT, HARNESS_PAGES_ROOT). Workflow patches for user: Library who-migration-2026-11-11/cat-harness-tools-workflows-harness-owner.patch, smart-base-ghbuild-smart-owner.patch. Still to do at migration: re-pin locks to WHO slugs, set SMART_OWNER + iriBase, regen KG, uganda canonical.
- Q-WHO-1 = C (merge manager): move starts 2026-11-12 04:05Z after merge window, whatever state. Runbook: /mnt/project-files/who-migration-2026-11-11/migration-runbook.md (order smart-base, smart-ra, other IGs, dth-*; needs user go before any push to WHO repos).
- User 16:42Z: migration = PRs from litlfred fork branches into WorldHealthOrganization/<repo>:main (no direct pushes to WHO). Secrets optional (only manual smart-base workflows). Runbook updated.
- 17:42Z cat-harness-tools#1918 MERGED. smart-base#351 ready, awaiting full tier/merge.
- 21:44Z smart-base#351 MERGED. Both prep PRs landed; runbook section 0 satisfied except workflow patches.
- 21:5xZ workflow patches pushed as PRs (sandbox CAN push workflow files now): cat-harness-tools#1922, smart-base#352 (drafts). Hand to merge manager when green.
- 23:41Z smart-base#352 MERGED.
