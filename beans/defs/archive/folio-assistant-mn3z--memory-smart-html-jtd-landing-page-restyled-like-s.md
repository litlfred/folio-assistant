---
# folio-assistant-mn3z
$schema: bean/1.0.0
title: 'Memory: smart-html-jtd landing page restyled like smart.who.int publications table (PR #7, issue #6), in IG theme'
status: completed
type: task
priority: low
created_at: 2026-11-10T17:38:18Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-html-jtd-landing-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-html-jtd landing page restyled like smart.who.int publications table (PR #7, issue #6), in IG theme

Thread "Make smart-html-jtd site look like smart.who.int" (cmsg_017WNUkNK8kdDziPK58Pv6G98z3cnMESAZVypuU1jG4cac), 2026-11-10.
- User: landing should look like smart.who.int's "SMART Guideline Publications" table (domain+cover, date, DAK L2 PDF, DAK components, FHIR IG L3 + GitHub) BUT use a theme consistent with the existing IG sites.
- Draft PR litlfred/smart-html-jtd#7 (issue #6, branch claude/landing-publications-table): scripts/landing.py renders index.html from optional sites.json fields (domain, cover, published, dak, components{page|url}, section=foundations, summary); compose.py calls it. Theme = page-layout.css tokens (bar #1c4b7c), dark via saved `fa-color-scheme`. No WHO emblem (not official site). smart-base under "Shared foundations".
- Card Q-JTD-1 asked: rows = only IGs hosted here (A, rec) vs full WHO catalogue (B).
- Sandbox proxy blocks iris.who.int covers; screenshots in /mnt/project-files/smart-html-jtd-landing-2026-11-10/.
Related: folio-assistant-o6rs
- 17:45Z Q-JTD-1 = A, then user: table must be DYNAMIC, list all harnessed litlfred smart-*/dth-*, add draft FHIR IG links, add DTHs + smart-ra as L2 documents (smart-ra "should be dth-ra"; its harnessed content should match dth-*). Pushed 9e8e5da: scripts/catalog.py discovers repos (index.lock.json + gh-pages), folio manifest -> documents, sushi -> IG, declaration coverage.visualiser -> links; overrides (cover/DAK/date) in sites.json catalog. Found: DTH manifests say documentKind smart-base:dth level L1 although smart-base has l2-dth kind (not changed: content hold). dth-sc publishes only its document.
- 17:51Z user forked smart-anc, smart-fp, smart-dak-pnc/tb/ccc/smbp/srv/chud, smart-tuberculosis, smart-ccc (not yet harnessed; not icvp/ph4h/ts/l2-hhas). Card Q-JTD-2: harness them?
- 18:51Z Q-JTD-2 = A: coordinator asked to start a separate thread to harness the 10 new forks. PR #7 green (CI catalogue 13 listed), waiting on owner merge + Compose dispatch.
- 19:11Z owner 'prepare to merge': PR #7 marked ready (head caf0665, clean); ready-to-merge label refused by safety check; merge request sent to merge-manager thread. Forks thread harnessed the 10 forks (no gh-pages yet; it is turning Pages on). After merge: dispatch Compose and deploy.
- 19:13Z PR #7 MERGED. Remaining: owner dispatch Compose and deploy; forks thread enabling gh-pages for 10 new forks.
- 19:21Z owner deployed; gh-pages 5e94f40 index has guidelines/handbooks/foundations, 13 entries. Thread left open for owner review.
- 19:28Z owner: IG sub-site rail Home must go to https://litlfred.github.io/smart-html-jtd/ (IGs are subgraphs of the jtd KG). Drafts: tools#1779 (issue #1778; RailPage.home from data-fa-home, railModel homeHref), cat-harness#1202 (navbar.js regen, merge with #1779), smart-html-jtd#8 (compose sets data-fa-home). Takes effect after IGs re-pin tools/cat-harness. Another thread fixes navbar expand/collapse (navbar.js regen conflicts possible). Local test setup: sibling layers + /home/user/node_modules -> tools node_modules.
- 19:37Z tools#1779, cat-harness#1202, jtd#8 all green; mark-ready refused by safety check -> card Q-JTD-3 (A ready + merge manager, rec).
- 19:47Z Q-JTD-3 = A (owner tap): marked tools#1779, cat-harness#1202, jtd#8 ready; merge request sent to merge manager.
- 20:05Z user: landing missing translation + search, align with IG headers, add LHS navbar grouped. Draft PR smart-html-jtd#9 (issue #10, branch claude/landing-ig-chrome): landing.py uses IG head assets + ig-topbar + rail (assets/navbar/rail-landing.js, groups SMART Guidelines / Handbooks (DTH) / Foundations); compose.py copies chrome assets from first hosted IG and merges every hosted IG's ig-search.json. cat-harness#1202 superseded by #1201 (only navbar.js).
- 20:03Z jtd#9 merged (owner card A) + Compose deployed (gh-pages 5a7e059). 20:02Z user: Foundations gets "Publications (L1)" = who-iris digital health items as referenced links, smart-base(-clinical) under "Technical". Draft jtd#12 (issue #11): sites.json catalog.publications = 13 IRIS handles; catalog.py sparse-clones who-iris catalogue for title/date/cover/entry page (https://litlfred.github.io/who-iris/cat-harness/library/who-iris/<libraryId>/).
- 20:14Z PR #12 merged (card A) + deploy dispatched (run 42893240007). 20:14Z user: alphabetise in general in selected locale -> draft jtd#14 (issue #13): Intl.Collator by docs-ui locale order (?lang, page lang, fa-locale, en), data-sort on rows/cards/menu li, rail-landing.js sorts itself; smart-ra pinned last; L1 alphabetical.
- 20:20Z PR #14 merged (card A), deployed (run 42893894435, main a1e747f). All landing work live; thread left open for owner review.
