---
# folio-assistant-wm26
$schema: bean/1.0.0
title: 'WHO migration: smart-*, dth-*, who-iris to WorldHealthOrganization'
status: in-progress
type: epic
priority: high
created_at: 2026-11-15T19:40:00Z
updated_at: 2026-11-24T08:30:00Z
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
- Q-WP-6 = A: this work item.
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
- [x] T7 non-forks: smart-trust-demo rename + fork (owner) — superseded: litlfred history starts at WHO's initial commit, so WHO smart-trust-demo#2 took it as a plain branch (merged 2026-11-16, verified); see [[folio-assistant-st16]]
- [ ] T8 migration PRs in layer order: smart-base, base-clinical/core, trust, trust-phw, immunizations, smart-ra, other IGs, dth-*, smart-ig-template (PR to `master`)
- [ ] T9 smart-html overlay compose, parity report, PR to WHO
- [ ] T10 canonicals: uganda, smart-fp, smart-tuberculosis; production ids for DTHs, smart-trust-tools (owner)
- [x] T11 this work item
- [ ] T12 Claude GitHub App on WHO repos (owner; urgent for dth-hrh, who-iris)
- [ ] T13 per moved repo: deprecate litlfred copy, re-pin harness locks to WHO
- [ ] T14 review sheets to WHO per moved repo (DTH-HRH done 19:4xZ: Config CFG + Agent links + instruction lines; others after their WHO merge, Issue cells from the Q-WP-7 map; who-iris has no sheet)
- [ ] T15 (smart-ra: see [[folio-assistant-t15r]]; fork side done, 7 WHO content PRs still open) issues and PRs of fork-moved repos: copy open issues to WHO by REST (issue transfer only works within one owner), back-links both ways, old→new map; parked content PRs re-opened from the same fork branch into WHO; cross-refs and review-sheet rows updated from the map (plan section 11; Q-WP-7 = A copy + close originals, owner 19:38Z; Q-WP-8 = A land or park, re-open from fork branch, owner 19:38Z)
- [ ] H10 REPIN_TOKEN secret or "Allow GitHub Actions to create pull requests" in WHO (owner)

## Migrated since 2026-11-16 (verified by git, 2026-11-24)

Each line: litlfred main content merged into WHO main (merge commit), and how far litlfred main has moved on since. "Ahead" = litlfred main commits not on WHO main today; the litlfred copies are not yet deprecated (T13) and are still being committed to.

- smart-ra: WHO#86 and WHO#89 (2026-11-19, a6435d8, litlfred main 0ce33a4); litlfred main is fully on WHO main (0 ahead). WHO#92 (11-21) since. Content PRs #74 #76 #77 #79 #80 #81 #82 still open (T15).
- dth-sc: syncs WHO#1 #2 #4 (11-17), #5 (11-18, litlfred 6aaf7e3), #8 (11-21); litlfred 5 ahead.
- dth-pc: WHO#1 #2 (11-17), #3 (11-19, litlfred e9e0d07), #5 (11-21); litlfred 7 ahead.
- smart-trust-demo: WHO#47 #48 (11-18), #49 (11-19), #50 (merged 11-23, litlfred #175 Country Canvas); WHO gh-pages publishes WHO main 20a7590 (11-23); litlfred 8 ahead.
- smart-trust: WHO#149 #152 and #156–#164 (11-16); WHO gh-pages publishes WHO main dd60f67 (11-17); litlfred 6 ahead.
- smart-trust-phw: WHO#23 (11-16), #25 (11-18, iriBase under WHO site); litlfred 7 ahead.
- smart-base-clinical: WHO#9 (11-19); litlfred 5 ahead.
- smart-immunizations: WHO#144 (11-19); litlfred 5 ahead.
- smart-tuberculosis: WHO#2 (11-19); litlfred 4 ahead.
- smart-anc: WHO#54 (11-19, WHO default branch master); litlfred 2 ahead.
- smart-trust-tools: WHO#6 (11-19); litlfred 5 ahead.
- smart-ips-pilgrimage: WHO#22 (11-18, iriBase to WHO site); litlfred 11 ahead.
- smart-hiv: WHO#55 (11-19); smart-fp: WHO#6 (11-19, WHO default master); smart-pcmt: WHO#8 (11-19). No common history in a 2026-10-01 shallow window, so the ahead count is not meaningful.
- Not migrated yet: smart-base (WHO#339 11-19 is a partial sync; litlfred main 1268 commits ahead), smart-ig-template (WHO master e6ab2bd is behind litlfred main by 17), smart-core (not checked), smart-html (WHO main contains litlfred main; T9 overlay not started as far as git shows).
- Every WHO repo above has a gh-pages branch. litlfred/smart-trust and litlfred/smart-trust-demo gh-pages are redirect pages (2026-11-16); litlfred/litlfred.github.io#2 (redirects for dth-hrh, who-iris) merged 2026-11-15.
- Claude branches exist in WHO repos (e.g. WHO/smart-ra claude/sync-litlfred-2026-11-19, WHO/dth-pc claude/site-build-document-folio), so the App can push there (T12, at least for those repos; per-repo state unverified).

## Early moves (before the gate)

- dth-hrh transferred 2026-11-15 19:19Z (WHO HEAD 471ef2f). Pages followed to worldhealthorganization.github.io/dth-hrh; litlfred.github.io/dth-hrh dead. Red Site publish fixed by re-pin draft WorldHealthOrganization/dth-hrh#143 (issue #142, core ca536a5). Still naming litlfred: iriBase, review/wg-comment/config.json, README. No other lock pins it. Plan section 9/9a.
- who-iris transferred 2026-11-15 19:20Z (WHO HEAD 6daa42c). git/raw URLs redirect, so pinned fetches work. litlfred.github.io/who-iris is 404 and ~19k IRIs/links point there: enable WHO Pages, then iriBase switch + regen. Lock entries `litlfred/who-iris` in nearly every layer: rewrite to absolute WHO in layer order (tooling thread). Plan section 10.
- Never recreate a repo named litlfred/dth-hrh or litlfred/who-iris (kills the redirects).

_2026-11-15T19:40:00Z_ — Filed by thread "Plan migration of content repos to WHO" (session https://claude.ai/code/session_01Qmmkt56R29ju7L1jFqMEJi).

_2026-11-15T21:35:00Z_ — who-iris: WHO/who-iris#298 merged 21:23Z, WHO Pages live (gh-pages 3e34c59); draft #300 moves iriBase + 19,718 IRIs to WHO staging root; still litlfred: `repository`/theme in who-iris.json and the separate repo who-iris-cdn (move decision open). litlfred/cat-harness-tools reusable workflows run under the WHO org. Pages redirect for dth-hrh and who-iris: litlfred/litlfred.github.io#2 (owner merges + enables Pages). smart-ra not yet merged in WHO (main at fork point), so no redirect yet. DTH-HRH review sheet pointed at WHO.

_2026-11-16T00:19:00Z_ — smart-ra T15 fork side done: comments of the 24 original issues and 8 PRs dumped to project file who-migration-plan/issues/smart-ra-fork-comments.json; each original commented "Moved to WorldHealthOrganization/smart-ra#M"; issues closed not_planned, PRs closed, all source branches kept. DPI-H sheet REPO_URL and open-PR links already on WHO.

_2026-11-16T00:24:00Z_ — smart-ra: WHO main (bff9597) merged by merge commit into the fork branches of WHO PRs #74 (8b0525c), #77 (7615bb7), #79 (41aa3fd), #80 (7832699), #81 (d34b26b), #82 (aba3eca); conflicts resolved, no rebase or force-push. #82 model re-derived with archimate-from-glossary --write (check clean). #83 left to the merge manager re-pin.

_2026-11-24T08:30:00Z_ — Filed from folio-assistant#3163 because beans/ on main is no longer the store (the work plan lives on the state branch). Added "Migrated since 2026-11-16" from git (ls-remote, shallow fetches, merge-base ancestry of litlfred and WHO mains and of PR heads). Verified: WHO smart-ra#89 merged (litlfred main fully on WHO), dth-sc syncs #1–#5 and #8, smart-trust-demo#50 merged 11-23, and the other syncs listed; who-iris#298/#300 and dth-hrh#143 merged 11-15. T7 ticked as superseded. Not checkable here: issue states, Pages settings, review sheets (T14), org settings (T6, H10). The epic stays in-progress: gate, T3–T6, T8 (smart-base, smart-ig-template, smart-core), T9, T10, T13 and T15 are open.
