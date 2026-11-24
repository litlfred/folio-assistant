---
# folio-assistant-st16
$schema: bean/1.0.0
title: 'Handover 2026-11-16 09:30Z: WHO smart-trust and smart-trust-demo sites'
status: in-progress
type: task
priority: high
created_at: 2026-11-16T09:30:00Z
updated_at: 2026-11-24T08:30:00Z
parent: folio-assistant-v8bg
tags:
    - handover
    - who-migration
---

Thread "Fix WHO smart-trust-demo 404" (cmsg_017WNUkNK8kdDziPK58Pv6G9ADCysxC5KzzfLdWqnBQE4a), session https://claude.ai/code/session_01Qmmkt5MLhsZSvtZqzmTnzf. Re-check every PR live before acting.

## Goal
Owner 06:54Z: why is worldhealthorganization.github.io/smart-trust-demo a 404, and why is /smart-trust not republished. "ASAP fix, highest priority."

## Cause
Neither repo had moved. WHO/smart-trust-demo held only its 10-23 initial commit (no gh-pages, Pages off). WHO/smart-trust main sat at 10-30 with the old IG Publisher build (10-26); the fork's 495 commits were never PR'd to WHO.

## Done (all WorldHealthOrganization/*)
- smart-trust#149 (issue #148) merged 07:01Z (owner card): fast-forward of litlfred main edb7bb4.
- smart-trust-demo#2 (issue #1) merged 07:01Z: litlfred main pushed as WHO branch claude/move-from-litlfred (litlfred history starts at WHO's initial commit ee94727, so no rename/re-fork; Q-WP-3c superseded). Pages enabled by owner after I created gh-pages.
- Stopgaps on gh-pages: smart-trust 4567382 (259 files litlfred.github.io/smart-trust -> WHO); demo 51d2a28 (copy of litlfred gh-pages 1712ec3, addresses rewritten). Both now superseded or about to be by WHO's own publishes.
- Owner card B 07:30Z: make WHO publish work alone + redirect litlfred.
- smart-trust-demo#6 (issue #5) merged 08:14Z: iriBase + generated IRIs to WHO, archimate regenerated. smart-trust-demo#15 merged 08:44Z: injection QA re-recorded against main's refreshed AST. Demo Site publish from WHO GREEN 08:48Z (gh-pages "Publish smart-trust-demo f1fe741").
- smart-trust#152 (issue #151) merged 09:03Z (full tier green): iriBase + generated IRIs to WHO; rebuilt archimate/1.7.5/smart-trust.archimate (my sed corrupted the zip) and the trust-network figure's view id.

## Left to do (refreshed 2026-11-24)
- [x] 1. smart-trust#153 (injection QA re-record after #152): not merged (head e0f26bc is not on WHO main) and GitHub no longer serves its merge ref, so it appears closed; superseded by later WHO merges #156–#164 (2026-11-16). WHO/smart-trust gh-pages publishes WHO main ("Publish smart-trust dd60f67", 2026-11-17), so WHO publishes on its own (verified by git). Whether gh-pages still names litlfred.github.io/smart-trust: unverified.
- [x] 2. Redirect litlfred.github.io/smart-trust and /smart-trust-demo: litlfred gh-pages tips are "Redirect every page to worldhealthorganization.github.io/smart-trust" (586f31e) and "…/smart-trust-demo" (65a53d78e), 2026-11-16 (verified). Fork site-publish disabled: unverified.
- [x] 3. All 6 UN languages on the demo site: handed to a separate thread; closed here on the merge manager's report (2026-11-24) that #253 is the only open item (unverified).
- [x] 4. Layers cache refs: WHO/smart-trust now holds 34 and WHO/smart-trust-demo 13 cat-layers refs (verified), so a re-pin has published there.
- [ ] 5. WorldHealthOrganization/smart-trust#253: the only open item (merge manager, 2026-11-24). WHO/smart-trust has no pull request #253 (its highest is #169), so it is an issue; its state is unverified. (litlfred/smart-trust#253 is a different, open PR: a re-pin of cat-harness-tools and folio-assistant-core, 2026-11-19.)

Demo site: WHO/smart-trust-demo#50 merged 2026-11-23 (litlfred #175, Country Canvas as printed) and gh-pages publishes WHO main 20a7590 (verified).

## Gotchas learned
- Injection QA digest includes generated UUIDs and build dates in PlanDefinition narratives: any IG-input change rebuilds the AST on main and stales the review. Record the review AFTER main's IG AST refresh (restore with `fhir-harness/scripts/ig-repo-site.ts ast --ig .`, check digest matches the CI refusal, `ig-content-qa.ts scan` then `record`), in a QA-only PR.
- Never sed binary files: `.archimate` is a zip; regenerate with archimate/build.py. View/element ids derive from the IRI namespace, so figures linking a view id must be updated.
- The merge API was refused by the safety check on a card tap once; a fresh tap per PR worked.
- State is also in /mnt/project-files/who-migration-plan/who-migration-plan.md section 2026-11-16.

_2026-11-16T09:30Z_ — created at owner's handover request.

_2026-11-24T08:30:00Z_ — Filed from folio-assistant#3176 because beans/ on main is no longer the store (the work plan lives on the state branch). Checked by git: #149 #152 merged, #153 not merged (superseded), WHO gh-pages for both sites publish WHO main, litlfred gh-pages are redirects, cat-layers refs present on WHO. Open: WHO smart-trust#253 (issue, state unverified), so the work item stays in-progress.
