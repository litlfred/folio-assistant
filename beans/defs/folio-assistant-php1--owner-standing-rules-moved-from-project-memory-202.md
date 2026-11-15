---
# folio-assistant-php1
$schema: bean/1.0.0
title: 'Owner standing rules (moved from project memory 2026-11-12)'
status: in-progress
type: task
priority: critical
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-15T13:27:00Z
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

- ALWAYS LINK BACK TO THE THREADS (owner 2026-11-15 07:35Z, cmsg_017WNUkNK8kdDziPK58Pv6G97zc7wGcaUNohvrwLDZidm5): "ALWAYS provide link back to the threads". Every status post, by every session, links the thread(s) it reports on.
- MERGE MANAGER IS NOW THE PROJECT THREAD (owner 2026-11-15 06:32Z: "there was anotehr merge manager while you stalled. no more"): the cshk_01VQDpPffYARDQ8juksAZScf session is retired. Hand merges to the Merge manager thread https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9HtujCofFVVPVPppfDRTSNR. The hand-off steps above still apply.

_2026-11-15T07:37:00Z_ — Two rules added by the merge manager thread (session_01Qmmkt6te9q7bF3KBT2Qq11).

- STACKED FAST-GREEN MERGES FOR NON-CONTENT PRS (owner 2026-11-15 11:52Z, option C "A and B together" on the coordinator's card "How should we stack PRs to merge faster?"): (A) batch the ready non-content PRs of a repo onto one batch branch with one CI run, and split the batch when it is red; (B) merge a batch, or a single non-content PR, on fast-tier green. The full tier then runs on main, and the merge manager fixes any red on main straight away. Content PRs still need the owner's own card or words.

_2026-11-15T11:55:00Z_ — Rule added by the merge manager thread (session_01Qmmkt6te9q7bF3KBT2Qq11), relayed by the coordinator.

- STABLE POINT (owner 2026-11-15 11:52Z, cmsg_017WNUkNK8kdDziPK58Pv6G9J8Nz4J5k3tcRVLHgwirDCZ: "i want to get everything ready merged in, then red fixed. then get to STABLE POINT"). Work in that order: merge every ready PR, then fix the reds, then check the stable point. The stable point holds when all four of these are true at once:
  1. Every harness repo's main is green on its latest run of each push workflow: Harness PR checks / main-qa, and Site publish where the repo publishes. The known by-design blind checks don't count.
  2. The folio-assistant train has landed: index.lock.json pins every layer at that layer's current main, and fa main is green on that pin.
  3. No ready PR is left unmerged. Ready means non-draft, with a `ready-to-merge` label or a merge-manager queue entry, not content waiting on the owner or committee, and fast-tier green. The PRs held for the owner or committee are listed, not counted.
  4. Every site is live: each published site's pages are at or after its main's last publish-relevant commit.
  The merge manager reports when all four hold, with links.

_2026-11-15T11:58:00Z_ — Rule added by the merge manager thread (session_01Qmmkt6te9q7bF3KBT2Qq11), relayed by the coordinator with the owner's message cited.

- LAYER-DEPENDENCY ORDER (owner 2026-11-15 12:00Z, cmsg_017WNUkNK8kdDziPK58Pv6G9LKygNEa5Ajh3uHf4Ejsq9m: "prioritize in order of layer dependnecy so cat-harness > cat-harness-tools etc"). Merges and red fixes go in layer order: bootstrap, bootstrap-tools, cat-harness, cat-harness-tools, folio-assistant-core, fhir-harness, smart-base, then the content layers (smart-trust, smart-trust-phw, who-iris, smart-immunizations, smart-ra, dth-*), then folio-assistant, then the sites. Within a layer, finish its ready PRs and fix its main red before moving to the next layer. Exception: a re-pin that carries a lower layer's fix may land as soon as that fix is on the lower layer's main. The stable-point table in merge-manager/status/latest.md is ordered the same way.

_2026-11-15T12:02:00Z_ — Rule added by the merge manager thread (session_01Qmmkt6te9q7bF3KBT2Qq11), relayed by the coordinator with the owner's message cited.

- NO CONTENT REVIEW NOW (owner 2026-11-15 12:17Z, cmsg_017WNUkNK8kdDziPK58Pv6G9NeXt6MTkaqFemkYVUDmQtC: "i dont want to review the content now"). PRs labelled `content` stay drafts and out of the merge queue. Post no content review or merge cards until the owner asks for them. Reviving content drafts (merging main, re-pinning, fixing mechanical reds, labelling) goes on. Content the owner already approved before this rule, such as smart-ra#257 (11:59Z card), may still merge on green.

_2026-11-15T12:20:00Z_ — Rule added by the merge manager thread (session_01Qmmkt6te9q7bF3KBT2Qq11), relayed by the coordinator with the owner's message cited.

- CONTENT LABEL + REVIEW RECORD (owner 2026-11-15 12:11Z, cmsg_017WNUkNK8kdDziPK58Pv6G9UZsDKJq4h45Vx9mAMZF94G: "dont include content PRs in the the table. also update the process and skills so content PRs get a label and that indicates a context review process needs to be documented as part of making it re[ady]. label all existing content PRs as such"). A content PR changes folio content text or substance: block wording, tables, figures and their source models (ArchiMate, BPMN, DMN), glossary, references, change sets, public-comment responses, IRIS summary re-derivations; a regenerated content table or figure counts. Not content: harness or tool code, workflows, pins, beans, tests, platform docs. Every agent labels a content PR `content` (colour 0e8a16; exists in smart-ra, dth-hrh, dth-pc, dth-sc, dth-sfp, dth-phc, who-iris), keeps it a draft, and before marking it ready adds a `## Content review` section to the body that points to the review record (owner card id, committee or review-log link, editing-hci-validation instance, review page); never a made-up review step. merge:guard check 9 `content-review` enforces it (pending on a draft, failure on a ready PR), and merge:watch leaves content PRs out of the merge manager's table (cat-harness-tools#2303, skills cat-harness#1351, prepare-merge §"Content PRs"). 22 open content PRs labelled 12:15Z. Functional changes inside a content PR are split into their own non-content PR (owner 12:18Z).

_2026-11-15T12:25:00Z_ — Rule added by the content-label thread (session_01Qmmkt5zDzPvBBU7QUoku32), from the owner's own message in that thread.

- MERGE PROCESS ACROSS DEPENDENT REPOS (owner 2026-11-15 12:23-12:24Z, cmsg_017WNUkNK8kdDziPK58Pv6G9YQ8CdihHMetxqXUjecrv3W, …KELTA27o7gEtBuZPw2cPGG, …TBB8QNVxZkoy1cKyiFipRk, …18XfDfjMo6XbHXPnPMCiA5: "update merge manager skills with these (say more generlally in terms of dependencies in software PRs...)", "upidate skills and processes", "and with all the improvemntes we made in this thread to process", "if we get a backlog of CI, then stack PRs and merge together/fix fallout"). The canonical text is cat-harness skill merge-manager-watcher §"Merging across dependent repositories" (cat-harness#1351), 15 rules: dependency order; CI queue re-ordered lowest first (cancel queued, never running); batching per repo + CI backlog playbook (switch in at oldest queued 60+ min with nothing landed or 3+ ready PRs each waiting on CI; stack, merge together, fix fallout; switch back under 15 min and main green); checkable stable point and per-repo report without content; content PRs drafts, functional changes split out, main-update only after dependencies stable; reviving stale drafts; no state-branch commit from a sparse checkout; one merge manager; re-pins/integration on full green; fixed-interval reports with owning thread links, held while owner away; draft register (drafts.md); no idle agents; one tappable card per question; approvals recorded durably and pre-hold approvals stand; ignored repos (qou) left out.

_2026-11-15T12:30:00Z_ — Rule added by the content-label thread (session_01Qmmkt5zDzPvBBU7QUoku32), from the owner's own messages cited by the coordinator.

- LOWER LAYERS NEVER WAIT ON HIGHER ONES (owner 2026-11-15 13:22Z, "why are the 2 not merged? they are lowest"). A lower-layer PR is never blocked on a higher layer's lock or pins. If its only red is a gate that also fails on main because CI mounts a higher layer's older pins (e.g. gen:jsonld:check run with the cat-harness-tools pinned in folio-assistant's lock), that red is not the PR's, and the PR merges. Longer-term fix: a layer's CI tests against its own dependencies.
- READY AND GREEN MERGES AT ONCE, LOWEST LAYER FIRST. A ready PR that is fast-green, or red only on reds that also fail on main and that it doesn't cause, merges in the same tick, in layer order.
- EVERY RED PR HAS AN ACTIVE FIXER. A red PR is never left waiting on something else. The merge manager names its owner thread or sends a fix agent the same tick; drafts.md/latest.md show who is fixing it.
- STALL WATCHDOG (owner 13:23Z "things were just sitting there"). If the stable-point table in merge-manager/status/latest.md is flat for 10 minutes (no merge, no main turning green, no red count falling), the merge manager acts on the lowest stuck layer, or posts one line saying what blocks it and who is fixing it.
Skill text: merge-manager-watcher rules 16-19 (cat-harness#1351).

_2026-11-15T13:27:00Z_ — Rules added by the content-label thread (session_01Qmmkt5zDzPvBBU7QUoku32), text relayed by the merge manager thread (session_01Qmmkt6te9q7bF3KBT2Qq11) quoting the owner.
