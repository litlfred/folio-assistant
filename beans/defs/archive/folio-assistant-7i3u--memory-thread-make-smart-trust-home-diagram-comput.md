---
# folio-assistant-7i3u
$schema: bean/1.0.0
title: 'Memory: Thread "Make smart-trust home diagram computable" (2026-11-11) - issue smart-trust#192, card Q-STH-1, stale gh-pages'
status: completed
type: task
priority: low
created_at: 2026-11-11T13:11:54Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-home-figures.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Make smart-trust home diagram computable" (2026-11-11) - issue smart-trust#192, card Q-STH-1, stale gh-pages

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9Vfe8zY2EG5ouEJJbgyctqj. User 13:08Z 11-11: "make diagram here computable https://litlfred.github.io/smart-trust/".
- Home page = overview.md. Fig 1 Trust Network is already PlantUML (#169, see folio-assistant-hau0) but gh-pages last published 2026-11-01 (still trust_network.png). site-publish.yml is workflow_dispatch only; 11-01 run failed ("no workflow calls a reusable workflow a publisher builds"). Dry run (plan=true) dispatched 13:11Z, run 43026852598.
- Fig 2 Participant_Onboarding_Status.png = WHO slide (2026-10-01: 86 total, 31 onboarded, 34 in progress, 18 in discussion). Unused participants_by_region.svg (no generator) from Participants CodeSystems + ConceptMap ParticipantsToWHORegionalOffices; different data.
- core figure-coverage reads folio entries only, not IGs; inventory kept in #192.
- Card Q-STH-1 (cmsg_017WNUkNK8kdDziPK58Pv6G9X6gCzEWmHfJNM79c7am3ww): A slide -> data file + generator, linked/checked vs FHIR (rec, being worked); B FHIR only; C both; D keep picture.
- github.io blocked from sandbox: read gh-pages via raw.githubusercontent.com.
- Coordinate overview.md .pot changes with translation thread cmsg_017WNUkNK8kdDziPK58Pv6G95t7cWfzxEoMPbkQnqw15f9.
- 13:16Z Q-STH-1 = A (tap). Draft PR smart-trust#194 (branch claude/participants-figure-computable, e1b22bc, subscribed): input/figures/participant_engagement.json + input/scripts/participant_engagement_figure.py --check -> input/includes/participant_engagement.svg (inline include). Counted 85/34/33/18 vs slide 86/31/34/18; Indonesia WPRO on slide, SEARO in ConceptMap. SUSHI 0 errors (seed cache with fhir-harness fhir-cache-seed-npm --lock fhir-packages.lock.json). Translation thread told. Content: needs user OK before merge.
- 13:40Z #194 draft CI green (fast tier); publish dry run 43026852598 succeeded. Card Q-STH-2 (cmsg_017WNUkNK8kdDziPK58Pv6G9SXARbrrLKNaS1uUKAemVrK): A mark ready, merge on full green via merge manager, then one site-publish (rec); B publish now + again; C hold. Real publish = POST actions/workflows/site-publish.yml/dispatches ref=main.
- 14:27Z Q-STH-2 = A. #194: release label then ready; full tier queued on e1b22bc; handed to merge manager. main bbc1a54 (#189) now publishes smart-trust on push to main, so no hand dispatch needed; after merge check site-publish run + raw gh-pages index.html for participant_engagement / trust_network.svg.
- 14:42-14:58Z full tier failed twice (runner DNS: apt security.ubuntu.com in Playwright install, not ours). 15:31Z update-branch -> head 789c927, fresh full run. Merge manager told.
- 15:41Z 3rd failure (main side too): runner ubuntu 26.04 resolute can't resolve Ubuntu mirrors in `playwright install --with-deps`. Commented on #194, told merge manager + user. Re-run check scheduled 16:42Z (rerun all jobs of run 43049022504).
- 15:42Z merge manager owns the re-run (tools#1916 shared Playwright installer; probes every 30 min, re-runs #194 when mirrors clear). My 16:42Z check cancelled; CI events on #194 wake me. After merge: check push-to-main site-publish + live home page.
- 19:29Z #194 MERGED (main 2f9683f). Push publish 43087621282 FAILED: AST stale (IG AST refresh 43087621556 still queued; workflows race). Told merge manager (template fix). Plan: when AST refresh completes, re-run publish 43087621282, then check raw gh-pages index.html for "GDHCN Participant Engagement".
- 20:37Z publish re-run (after AST refresh ok) FAILED at render:bpmn: no Playwright chromium in shared folio-site-publish (tools pin bdeef82). Handed to merge manager (tools#1916). gh-pages still 11-01. Waiting for a green publish, then verify live page and resolve.
