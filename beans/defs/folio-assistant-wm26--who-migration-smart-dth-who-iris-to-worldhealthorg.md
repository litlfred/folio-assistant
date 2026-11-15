# folio-assistant-wm26
$schema: bean/1.0.0
title: 'WHO migration: smart-*, dth-*, who-iris to WorldHealthOrganization'
status: in-progress
type: epic
priority: high
created_at: 2026-11-15T19:40:00Z
updated_at: 2026-11-15T19:40:00Z
tags:
    - who-migration
    - handover
---

State of the move of the SMART content repositories from `litlfred/` to `WorldHealthOrganization/` (owner card Q-WP-6 = A, 2026-11-15 19:33Z: migration state lives here). Full plan, inventory and evidence: project file `who-migration-plan/who-migration-plan.md`. Earlier prep: project file `who-migration-2026-11-11/migration-runbook.md`, rule line WHO MIGRATION in folio-assistant-php1. Thread: https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9AzAAKv3FiAdygws4MJcT5P. Issue #3162.

Append `_<UTC>_ — <change>` below and bump `updated_at` after each change.

## Scope

- Move: smart-* (harnessed IGs, smart-ra, smart-base, smart-base-clinical, smart-core, the 10 forks of 11-10, smart-pcmt, smart-ig-template), dth-*, who-iris.
- Stay at litlfred (OHS org later, by GitHub transfer with HARNESS_OWNER switch): bootstrap(-tools), cat-harness(-tools), folio-assistant(-core, -sci), fhir-harness. Also smart-immunizations-uganda (Q-WP-3b = C).
- Not migrated (legacy, nothing ahead): smart-dak-immz, smart-dak-bds, smart-pcmt-vaxprequal(-archive), smart-pcmt-can-nvc, smart-pcmt-rhsc, smart-ra-old, smart-kg (retired), smart-html fork (0 ahead).

## Decisions (owner, 2026-11-15)

- Q-WP-1 = A ("want proper way. once on who/ the litlfred/ ones are deprecated"): owner derived from the git remote; content-layer pins resolve to the caller's owner; one publishing profile (stagingRoot `https://{owner}.github.io`, iriRoot WHO github.io, publishedRoot smart.who.int); per repo only `publish.id` + `publish.stage`. Migration PRs are plain merges. After a repo merges in WHO the litlfred copy is deprecated (banner, gh-pages redirect page, archive; never deleted); no ongoing sync.
- Q-WP-2 = A: smart-html-jtd ported into litlfred/smart-html (fork of WHO/smart-html) as an overlay compose that keeps WHO's release folders, package feeds, package.tgz and non-SMART trees, replacing only each harnessed IG's current build; URL parity report, PR to WHO, then Pages switch (reversible).
- Q-WP-3a dth-hrh = A transfer; 3b smart-immunizations-uganda = C stays at litlfred (only canonical fixed; its pins to moved layers must be absolute WHO entries); 3c smart-trust-demo = A rename ours (e.g. smart-trust-demo-src), fork WHO/smart-trust-demo, normal PR; 3d who-iris = A transfer (Q-WP-4 = A who-iris moves); 3e smart-html-jtd = B keep as test site, archive later.
- Q-WP-5 = A: transfer works (owner can create repos in WHO).
- Q-WP-6 = A: this bean.
- Rule M1: WHO merges migration PRs with a merge commit or fast-forward, never squash/rebase (pins name SHAs).
- Review/log Google Sheets must point at the WHO repos (owner 18:33Z): regenerate each sheet's Config tab (SITE_URL, REPO_URL) after its repo moves.

## Gate (G1-G10, plan section 1)

Merge-manager stable point; table covers all 37 repos (G2 done 18:40Z); every main green; no open non-content PRs, content PRs merged or parked; lock pins agree; materialized fixity; sushi 0 errors; staging sites load; two quiet sweeps 60 min apart; snapshot `claude/pre-who-2026-11-15` branches (tags blocked from agent sessions). Status 18:18Z: not reached, 13/18 green.

## To-dos

- [ ] T1/T2 stable point and gate (merge manager)
- [ ] T3 tooling: same-owner pins, derived owner, publishing profile, computed iriBase (tooling thread cmsg_017WNUkNK8kdDziPK58Pv6G94LP89hFRgqUtvWcbaP433v)
- [ ] T4 iriBase to WHO staging root + KG regen per repo
- [ ] T5 dry-run build with GITHUB_REPOSITORY_OWNER=WorldHealthOrganization
- [ ] T6 WHO org settings: Actions may call litlfred/*, merge commits allowed, Pages, gh-pages check (owner)
- [ ] T7 non-forks: smart-trust-demo rename + fork (owner)
- [ ] T8 migration PRs in layer order: smart-base, base-clinical/core, trust, trust-phw, immunizations, smart-ra, other IGs, dth-*, smart-ig-template (PR to `master`)
- [ ] T9 smart-html overlay compose, parity report, PR to WHO
- [ ] T10 canonicals: uganda, smart-fp, smart-tuberculosis; production ids for DTHs, smart-trust-tools (owner)
- [x] T11 this bean
- [ ] T12 Claude GitHub App on WHO repos (owner; urgent for dth-hrh, who-iris)
- [ ] T13 per moved repo: deprecate litlfred copy, re-pin harness locks to WHO
- [ ] T14 review sheets Config tab to WHO per moved repo
- [ ] T15 issues and PRs of fork-moved repos: copy open issues to WHO by REST (issue transfer only works within one owner), back-links both ways, old→new map; parked content PRs re-opened from the same fork branch into WHO; cross-refs and review-sheet rows updated from the map (plan section 11; cards Q-WP-7, Q-WP-8)
- [ ] H10 REPIN_TOKEN secret or "Allow GitHub Actions to create pull requests" in WHO (owner)

## Early moves (before the gate)

- dth-hrh transferred 2026-11-15 19:19Z (WHO HEAD 471ef2f). Pages followed to worldhealthorganization.github.io/dth-hrh; litlfred.github.io/dth-hrh dead. Red Site publish fixed by re-pin draft WorldHealthOrganization/dth-hrh#143 (issue #142, core ca536a5). Still naming litlfred: iriBase, review/wg-comment/config.json, README. No other lock pins it. Plan section 9/9a.
- who-iris transferred 2026-11-15 19:20Z (WHO HEAD 6daa42c). git/raw URLs redirect, so pinned fetches work. litlfred.github.io/who-iris is 404 and ~19k IRIs/links point there: enable WHO Pages, then iriBase switch + regen. Lock entries `litlfred/who-iris` in nearly every layer: rewrite to absolute WHO in layer order (tooling thread). Plan section 10.
- Never recreate a repo named litlfred/dth-hrh or litlfred/who-iris (kills the redirects).

_2026-11-15T19:40:00Z_ — Filed by thread "Plan migration of content repos to WHO" (session https://claude.ai/code/session_01Qmmkt56R29ju7L1jFqMEJi).
