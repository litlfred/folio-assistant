---
# folio-assistant-php1
$schema: bean/1.0.0
title: 'Owner standing rules (moved from project memory 2026-11-12)'
status: in-progress
type: task
priority: critical
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-13T20:49:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Every agent follows these. Newest rule wins where two disagree; the owner's message in a thread wins over this list. Links `folio-assistant-xxxx` point to the detail record.

- WHO MIGRATION (user 16:10Z 11-11): smart-* and dth-* repos move to WorldHealthOrganization. Q-MIG-1 = A (draft PRs removing hard-coded owner: tools#1918, smart-base#351). Q-MIG-3 = B: IRIs use staging root worldhealthorganization.github.io/<repo>/ now, scripted rewrite to smart.who.int at publish (both roots in smart-base site-roots.ts). Q-WHO-1 = C: move starts after 04:05Z 11-12 regardless. Move = PRs from litlfred forks into WorldHealthOrganization/<repo>:main only, no direct pushes (user 16:42Z). Order smart-base → smart-ra → IGs → dth-*. Secrets optional. Runbook: who-migration-2026-11-11/migration-runbook.md. Thread …AUsbwQds8zeTj52BZYspkj.
- MERGE WINDOW (user 16:05Z 11-11, extended "+12hrs window" 06:04Z 11-12): merge manager may repin + merge green non-content PRs without cards until ~18:05Z 11-12.
- RED-MAIN WATCH = MERGE MANAGER DUTY (user 21:56Z 11-10): merge manager watches red mains/failing runs in all harness repos and dispatches an agent to fix each; written into its process + skill. User wants failures fixed, not silenced (Q-CI-1 = B: tools#1812 not merged).
- RE-RUN POLICY Q-RERUN-1 = B (user 06:31Z 11-12): re-run CI only right before merging; never held content; wait for GitHub healthy after outages; refresh re-pin pins before re-running. rerun-policy (former memory record h5ud)
- VERSION BUMPS/RELEASE TAGS = GOVERNANCE (user 21:23Z 11-10): never bump versions or cut tags on our own. si tagged v0.2.0 by user (Q-REL-2 A); release process has tag step + catch-up check.
- GH-PAGES FIRST (user 20:22Z 11-10): create gh-pages branch first, THEN ask for Pages settings (check live per repo). bootstrap#49.
- PUBLISH STANDARD: reuse platform gh-pages route; deviations are a card first. Sites publish on merge. Size review is part of authoring.
- WHO-IRIS: official WHO translations feed glossaries/.po; sample 5 translated docs, all 6 UN languages, RTL-aware OCR. Referenced-only sources: derive KGs locally, don't keep the PDF. EXCEPTION (user 01:31Z 11-11): DO extract and keep figures and tables from IRIS docs. Q-FIG-1 = A (WebP q80, max 1600px); Q-FIG-2 = A but use the corpus's existing table format. PDF viewer dropped: link out to the IRIS PDF only. Summaries AND figure descriptions in all 6 UN languages for every entry (user 01:3xZ 11-11; supersedes Q-SUM-1 = B). Q-ODD-1 = A: fix extraction problems + errata notes for WHO's own errors; sensitive content untouched.
- THIN HTML (Q-THIN-1 = C+B): RDFa resource/typeof/prefix on the rendered element + a JSON-LD head block; one generic kg-render.js; custom XML must use proper namespaces. Q-THIN-3 = A (stub at IRI), Q-THIN-4 = A singular, Q-THIN-5 = B, Q-THIN-6 = B (library IRI moves in #1833), Q-THIN-7 = A (in steps).
- OPT-IN SUBGRAPH LINKS: Q = B (fix all dead links layer by layer, gate tools#1843 turned on last).
- SUSHI DIFF REPORTS: document carefully, store in KG, link from IG home (smart-fp, smart-anc). fhir repos: sushi clean before commit.
- RELEASE-GATED CI: red CI blocks only `release`-labelled PRs; main full suite hourly; never cancel started main runs (tools#1817 merged: per-push concurrency on main).
- MERGE: green code-only PRs may merge; content PRs need a card. Merge manager holds content w/o owner OK, committee work, dth-*/smart-ra content, WHO repos. Committee content never merged. CS- items and BPMN redraws are content. Q-WRAP-2 = C: content drafts reviewed one by one (prep threads write content-review/ summaries). Corpus gate: never fabricate person steps; Q-RA-VAL-2 = A (merge 7 smart-ra drafts with corpus gate waived by user taps).
- SITE SIZE: Q-SG-1 = C. ELM linked not embedded. Q-SZ-3 = C: root <Type>-<id>.json on gh-pages (fhir-harness#360 merged); Q-SZ-4 = B: CQL also linked. si at 13.8 MB before resources. Q-BIB-1 = A: IG sites list only own refs (core#760).
- Script/object tags: Q-TRP-3 = B, Q-RAIL-2 = C: fhir-harness trusted-scripts feature built once (demo rail thread owns), diagrams as images.
- Review-log: format changes don't count as changes; feedback hand-off to owning agent; stall watch (>2h take over); watcher polls 1 min. Change sets are human-controlled.
- Beans: handover memory on folio-assistant branch cat/cat-harness/beans (lgwt watcher, drnh drain).
- ArchiMate never a SKOS source unless ingested. IRIs: slash, no '#'.
- DTH-HRH 2015 MDS (CORRECTED by user 06:14Z 11-12): references to the 2015 MDS ARE allowed and must be cross-referenced; the 2015 MDS is just NOT the basis for the core data elements. Earlier "never reference 2015 MDS" reading was wrong; dth-hrh#109 (merged 06:08Z 11-12) removed refs and needs revisiting. 2015 guide goes to who-iris as L1+SKOS.
- Cards: Q-XXX-n, lettered options, recommendation, thread link; strike when answered; always list open cards with links.
- Use litlfred forks only, never WHO upstreams (except the WHO move PRs above). No Cloudflare except who-iris. Math repos: no empirical predictions; qou PRs held for user review. Never user's name in signedOffBy.
- Code.gs: never ask for updateFromGitHub; ff855ec7 not yet pasted. Workflows permission NOT granted.
- FICTIONAL COUNTRIES (11-11): Onesa = XXK (home), Taifafeki = XXR (visited), defined in smart-trust-demo scenarios/countries; replace Thailand/Malaysia/KSA/Lao; smart-trust value set uses the fake names (#180). Pilgrimage Q-FIC-3 = C: CONSENT-XXK/XXR added to IPS.HAJJ.CONSENT in smart-ips-pilgrimage only (never smart-trust); real codes + Malaysia ref impl stay.
- VaxLink retired; "narrative" renamed "journeys" (smart-trust-demo #112).
- GDHCN game: lives in smart-trust as web-app kind (tools#1864, cat-harness#1237 merged). Joiners pick 0..n trust domains. All 6 UN languages; translation thread owns ar/es/ru/zh. Narration: Q-VO-1 = A Chatterbox Multilingual, Q-VO-2 = B beat-04 en/fr only, smart-trust#191 merged voiceover-chatterbox (former memory record dwf1). User 09:08Z 11-12: merge smart-trust#199 (Play links) + re-pin #198 ASAP, gates overridden. Live URL: smart-trust/en/cat-harness/apps/onboarding-game/; private preview https://claude.ai/artifact/CguaB6822KSEWXCDLXSXzw.
- STANDING RE-PIN (Q-BIBNAV-2 = B, 09:07Z 11-12): re-pin all IGs once, then enable 6-hourly standing-repin.yml per IG (first: smart-trust#200; tracking tools#1948). Biblio thread owns.

- PROJECT MEMORY → BEANS (owner Q-MEM-1 = A 09:33Z, Q-MEM-2 = A+B 09:34Z, 2026-11-12): shared state lives in beans on `cat/cat-harness/beans`, not in Claude project memory (which excludes other agents). Project memory keeps only a pointer here plus the thread ids list.
- QUESTIONS TO THE OWNER (project instructions): the owner is disabled and finds typing hard. Every question = a full written question with every lettered option, trade-off and a recommendation, THEN a tappable decision card with the same letters. Never ask them to type answers.

_2026-11-12T09:45:00Z_ — Filed by thread "Record handover in beans" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9E8Y9ccXJsk3qvGEie1X5Pr), session https://claude.ai/code/session_01Qmmkt7NmLVnjA5oNtkbv3f.

- FUNCTIONAL ONLY FOR smart-ra / dth-* (owner 09:57Z 11-12): never merge smart-ra or dth-* content PRs that need committee or author review; merge only functional PRs (code, CI, pins). Supersedes any earlier card that queued content drafts for merge (e.g. Q-RA-VAL-2 A).

_2026-11-12T09:58:00Z_ — Rule added by https://claude.ai/code/session_01EucfRpkvK7d4FJyuqypQzm.

- NO DIRECT MERGES — SEND TO MERGE MANAGER (owner 20:44Z 11-13): "dont direct merge, just send to merge manager https://claude.ai/code/cshk_01VQDpPffYARDQ8juksAZScfEsSBcoJKmS94Kt8kP8nCnb". Never call `mergePinned`, `mergePullRequest`, or `gh pr merge` directly from worker/lane sessions; instead prepare the PR (mark ready for review, post session-signed `ready: <full-40-char-sha>` comment, add `ready-to-merge` label, and run `evaluate` + `postStatus` from `merge-guard.ts` to 8/8 PASS) and hand it off to Merge Manager https://claude.ai/code/cshk_01VQDpPffYARDQ8juksAZScfEsSBcoJKmS94Kt8kP8nCnb.

_2026-11-13T20:49:00Z_ — Rule added per owner instruction (`2026-11-13T21:44:32+01:00`).
