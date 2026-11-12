---
# folio-assistant-n6ny
$schema: bean/1.0.0
title: 'Project memory: owner rules, facts, to-dos, cards and threads (read first)'
status: in-progress
type: epic
priority: critical
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
tags:
    - project-memory
    - handover
---

## Read this first (every agent)

This bean tree is the project's shared memory. It replaced Claude project memory on 2026-11-12: owner card Q-MEM-1 = A (move ALL project memory into beans, 09:33Z) and Q-MEM-2 = A+B (09:34Z). Owner, 09:33Z: "PUT IN BEANS ... do not use project memory as that excludes other agents".

Rules for writers:
- Write lasting facts, owner rules, answered cards and handovers HERE (branch `cat/cat-harness/beans` of litlfred/folio-assistant), never in Claude project memory. Project memory now holds only a pointer to this bean and the thread ids list.
- New owner rule or answered card: append a line to folio-assistant-php1 (or folio-assistant-1b7t) as `_<UTC>_ — <rule>` and bump `updated_at`.
- Open workstream or handover: one bean per workstream under folio-assistant-v8bg (or a new dated handover epic).

Resume prompt: "read bean folio-assistant-n6ny on branch cat/cat-harness/beans of litlfred/folio-assistant, then its children".

## Children

- folio-assistant-php1 — owner's standing rules (in-progress; always applies)
- folio-assistant-wl48 — facts and references (sheet ids, artifacts, live state notes)
- folio-assistant-no51 — owner's own to-do list
- folio-assistant-1b7t — open and answered decision cards
- folio-assistant-f7ph — project thread directory (ids)
- folio-assistant-v8bg — handover 2026-11-12 09:32Z: open workstreams
- 261 archived detail records (`defs/archive/`, tag `project-memory`), one per former memory file, listed below.

## Detail records (former memory files)

| bean | former file | memory type | description |
|---|---|---|---|
| folio-assistant-01vv | `bpmn-guidance-fixes-2026-11-01.md` | project | Mechanical BPMN fixes to new guidance (2026-11-01): draft PRs, what's done, what waits, local tooling scripts |
| folio-assistant-02tv | `bean-archive-sweep-tests.md` | project | 2026-11-01 bean archive sweep (8cc6879) broke fa bun-test shards 1+2; fix in cat-harness-tools#1250 (issue #1248), needs merge OK + fa re-pin |
| folio-assistant-02yo | `stale-thread-review-2026-11-08.md` | project | 11-08 review of 35 stale threads (Nov 1-2): which close, restart, or need answers Q1-Q9; bulk card pending |
| folio-assistant-0a8c | `who-iris-official-translations-rule.md` | feedback | who-iris only — official WHO translations of a document seed its glossary terms and .po translations (user rule 2026-11-10) |
| folio-assistant-0l8b | `mvp-deploy-sibling-2026-11-01.md` | project | MVP sibling #3 (deployment + harness interface) state: owner taps Q-DEP-1..3 and open yj32 PRs |
| folio-assistant-14hq | `nhwa-indicator-extraction.md` | project | NHWA 2nd ed indicators -> L1 nodes -> L2 ProgramIndicator drafts, and the reusable indicator-extraction skill (2026-11-02); PRs, files, open DTH-HRH card |
| folio-assistant-1cnn | `smart-trust-demo-vaxlink-21.md` | project | smart-trust-demo issue 21: the VaxLink story (fredhersch/vaxlink) as DAK/IG; draft PR #22, two open cards |
| folio-assistant-1wue | `thin-html-node-linking-2026-11-10.md` | project | Thin HTML pages declare their KG node (RDFa + JSON-LD stub, generic kg-render.js, extensionless kind/id IRIs); Q-THIN-1..4, tools#1830/#1833 |
| folio-assistant-1x4m | `jtd-umbrella-node-kind-2026-11-10.md` | project | Design of a new node kind making smart-html-jtd the umbrella KG of SMART Guidelines (links L1/L2/L3 libraries); cards Q-UMB-1 name, Q-UMB-2 where |
| folio-assistant-1zrq | `review-brief-pane.md` | project | Review page "What to expect in this review" pane (cat-harness-tools#1153/#1154): data source and PR-body marker format |
| folio-assistant-20kq | `data-stores-2026-11-01.md` | project | Data store inventory and consistency pattern (2026-11-01): report link, findings, cards Q-DS-1..6, interpreter blocker |
| folio-assistant-2a0d | `dpi-h-review-sheet.md` | project | Where the DPI-H public-comment Google Sheet lives, its tabs, and the scheduled sync task |
| folio-assistant-2gst | `gh-pages-before-pages-settings.md` | feedback | Never ask the owner to turn on Pages until that repo's gh-pages branch exists (checked live at ask time) |
| folio-assistant-2hay | `public-comment-process-2026-10-31.md` | project | Public comment process model work on 2026-10-31: merged PRs, the release-cycle process, sibling threads and the preview repin PR |
| folio-assistant-2mfw | `mvp-freeze-2026-11-01.md` | project | MVP functional freeze: epic fa#2894 + milestone 1, scope, owners/threads, cascade status, rules learned |
| folio-assistant-2ncj | `figure-previews-svg.md` | feedback | When showing the user a generated figure, attach the SVG, not a PNG render |
| folio-assistant-2xsz | `s9-bpmn-guidance-merge.md` | project | Drain S9 (2026-11-01): user OK'd merging the 25 BPMN guidance draft PRs as non-content (Q-S9-1 A); list and order |
| folio-assistant-2yeq | `l1-requirement-ingestion.md` | project | L1 requirement ingestion design (2026-11-01): requirements are Stage-B candidates.json typed blocks using existing kinds; 2015 HRHIS MDS guide = functional requirements only, inspirational, never a data model |
| folio-assistant-36f6 | `merge-full-tier-rule.md` | feedback | Owner 2026-11-11 10:39Z (card B): never merge a draft on fast-tier green; mark ready, wait for full tier on the PR; plus pin-agreement gate |
| folio-assistant-398v | `dth-issue-drain-2026-11-01.md` | project | Thread "Drain DTH issues" (2026-11-01 09:48Z): triage of the 14 open DTH issues, owners, and siblings Q-DTH1..4 |
| folio-assistant-3c99 | `self-address-dead-links.md` | project | Dead journey actor/example links (index linked root <Type>-<id>.html) — fhir-harness #380/#381, cat-harness-tools #1894/#1895 self-address link check |
| folio-assistant-3f7g | `smart-trust-demo-fictional-countries.md` | project | smart-trust-demo #113: replace Thailand/Malaysia/KSA/Lao with fictional Onesa + Taifafeki (XX* codes); card Q-FIC-1 mapping |
| folio-assistant-3ug0 | `review-log-archive-import.md` | project | User asks (11-08) for nightly review-log archive into each log's own repo + one offline import process (incl. PDF line-numbered feedback template) |
| folio-assistant-3v15 | `si-resources-on-gh-pages-2026-11-10.md` | project | Owner 21:14Z 11-10 - IG gh-pages must carry resources (resources/<Type>/<id>.json) in the JSON-LD KG; release package.tgz via ig-release caller (si#133) |
| folio-assistant-3vk4 | `builtatpublish-declare-only-built.md` | feedback | Never declare a builtAtPublish path "for the future": derive:publish fails a declared artefact built empty, and only train stage jobs catch it |
| folio-assistant-3ymp | `dth-phc-computable-figures.md` | project | Thread "Make dth-phc figures computable" (2026-11-11) - survey of 15 figs, issue dth-phc#38, card Q-PHCFIG-1 |
| folio-assistant-40iw | `iris-doc-bibliographies-2026-11-11.md` | project | who-iris per-document bibliographies (user 02:21Z 11-11): references:extract tool core#733, who-iris#227 content, ingest step Task_References |
| folio-assistant-42gm | `bpmn-render-hinting.md` | project | CI-only "stale SVG" in BPMN render checks is caused by font hinting (sandbox unhinted, CI hints); fix is bootstrap-tools#66 |
| folio-assistant-4jbn | `bib-entries-nested-nav-2026-11-10.md` | project | Bibliography entry pages listed top-level in Pages rail; fix = parent/grand_parent front matter (core#716, issue #715) + rail labelUnder (tools#1780) |
| folio-assistant-4jih | `workflow-tools-gate-2026-11-10.md` | project | check:workflow-tools gate (every script a GitHub workflow runs is a Tool linked to a BPMN process) — tools#1761, cat-harness#1192 |
| folio-assistant-4tzb | `ig-section-rail-2026-11-08.md` | project | IG pages' ✎/📣 moved from heading text to the shared right-gutter box (tools+cat-harness+fhir-harness branches claude/ig-section-rail) |
| folio-assistant-4yjk | `smart-trust-un-translations.md` | project | smart-trust ar/zh/fr/ru/es translations (issue #133, draft PR #136): re-scoped 11-08 to verify main's set; method and gotchas |
| folio-assistant-5778 | `ccr-phase-split.md` | project | content-change-review split into phase subprocesses (2026-10-31): open PRs and the do-not-merge staging re-pin to close afterwards |
| folio-assistant-5ch9 | `open-work-by-topic-2026-11-01.md` | project | 2026-11-01 11:00Z topical analysis of open beans/issues (211 items), artifact link, how counted, cards Q-TOP-1..4 |
| folio-assistant-5dj9 | `bpmn-text-size-2026-11-02.md` | project | BPMN figures sized so task-name labels equal body text size (cat-harness#976, docs-ui fitTextToBody) |
| folio-assistant-5hkz | `drain-lanes-2026-10-29.md` | project | The six drain lanes (A-F) set up on 2026-10-29 and which stalled threads they absorbed |
| folio-assistant-6fv7 | `drain-status-2026-11-01-1900Z.md` | project | 2026-11-01 19:00Z drain analysis (44 beans, 147 issues, 154 PRs), Claude Doc link, blockers, card Q-DRAIN-19 |
| folio-assistant-6j3v | `ig-site-translations.md` | project | Why IG sites (smart-trust etc.) show no translations: fhir-harness IG route never injects .po (fhir-harness#382); Q-TRP-1 |
| folio-assistant-6mke | `iris-block-summaries-2026-11-11.md` | project | who-iris block summary drain 2026-11-11 — 6,444 blocks/187 entries, 16 agents, branch claude/iris-block-summaries stacked on #217, Q-SUM-1 language card |
| folio-assistant-6pek | `harness-drain-2026-11-02.md` | project | 2026-11-02 06:45Z harness-only drain analysis (cat-harness, tools, fhir-harness): counts, doc link, plan phases, card Q-HDR-1 |
| folio-assistant-6s1o | `pilgrimage-figure-archimate-2026-11-10.md` | project | Thread "Match pilgrimage landing page to original" (11-10): workflow figure layout, ArchiMate harness off in smart-ips-pilgrimage, figure-rebuild skill gap; card Q-PIL-1 |
| folio-assistant-6uqk | `bpmn-label-tidy-square-tasks.md` | project | BPMN label tidy pass (bootstrap-tools #87+#88 merged) + square-task redraws across repos (phw#61, fhir-harness#388, cat-harness#1254, core#757, bootstrap#54, ihris#46); Q-SQ-1, Q-BPMN-FIX-1 |
| folio-assistant-75rm | `repin-cascade-mvp-2026-11-01.md` | project | MVP Phase 4 re-pin cascade (thread …FDPvN5ktTn4HS2iruRVeZj): waves, PRs, how to seed/regen locks, gotchas |
| folio-assistant-78rq | `who-iris-body-repin.md` | project | who-iris#160 (catalogue page with no <body>) was already fixed in who-iris#133; the cause was smart-trust's stale who-iris pin, fixed by re-pin smart-trust#125 |
| folio-assistant-7dra | `dth-platform-proposals.md` | project | Beans 6chd (PDF re-segmentation), cysv (dth init), lo3p (DMN QA): Q-S4-1..6 answers, threads and PRs, 2026-10-31/11-01 |
| folio-assistant-7exb | `speed-deep-review-2026-11-01.md` | project | Deep review of CI/render/merge speed (2026-11-01 11:15Z): measured bottlenecks B1-B8, doc link, cards Q-SPD-1..7 |
| folio-assistant-7i3u | `smart-trust-home-figures.md` | project | Thread "Make smart-trust home diagram computable" (2026-11-11) - issue smart-trust#192, card Q-STH-1, stale gh-pages |
| folio-assistant-7j96 | `smart-base-stale-drafts-2026-11-08.md` | project | Triage of smart-base drafts #246/#259/#268/#273 and issues #242/#245 (thread …S3Bfr3EhHMBSScAVGY1pFJ); cards Q-SB-1..3 |
| folio-assistant-7jge | `agy-agent.md` | project | The Antigravity ("agy") agent on the user's machine also drains beans; how to tell its work apart and avoid clashing |
| folio-assistant-7n1j | `platform-ci-sibling-2026-11-01.md` | project | Second CI thread (MVP sibling #1, 21:32Z) split: fa#2857/ksek, fs43, 3fva, 1xhc/fa#937, rwmf; state of each epic and what blocks closing |
| folio-assistant-7w1o | `cone-deploy-fwtz.md` | project | Thread "Make the cone deploy safe to switch on" (bean fwtz): option B writer records, where verdicts live, pending preview-skip card |
| folio-assistant-82df | `bean-drain-2026-10-31.md` | project | Bean drain 2026-10-31 22:30Z: catalogue, skipped beans, and the four sibling sets S1-S4 (plan file path) |
| folio-assistant-8azk | `iri-no-hash.md` | feedback | Owner rule (2026-11-02): node IRIs should not use '#'; platform namespaces are currently …/v0/ns# (instanceNamespaceOf) |
| folio-assistant-8d8b | `local-web-server.md` | project | Thread "Plan local web server for rendered harnesses": local server at 127.0.0.1:4007 shipped (Phases 1-3, 2026-10-31/11-01), decisions and PRs |
| folio-assistant-8gr3 | `goal1-separation-2026-11-01.md` | project | GOAL 1 repo separation state for MVP (beans vuip/iirv/6fez/pga6) and owner answer Q-SEP-1 A |
| folio-assistant-8iag | `dth-shared-checks-cysv.md` | project | Bean cysv stages 1-2 (2026-11-01): core shared DTH checks (core#462), dth init (core#465), DTH switch branches, Q-CYSV1 sign-offs |
| folio-assistant-8j0l | `processed-beans-visualiser-2026-11-02.md` | project | Beans-by-process visualiser (processed-beans / processed-bean pages): issue, bean, mockup, cards, data finding |
| folio-assistant-8jbp | `agy-local-agent.md` | project | The owner's local Antigravity agent ("agy") also drains beans; how to recognise its commits and avoid clashing |
| folio-assistant-8jxt | `gutter-icons-bigger-2026-11-10.md` | project | Right-gutter (RHS grill) 📣/🔖/🔗 icons 50% bigger at >=64rem (issue tools#1806, PRs cat-harness#1213 + tools#1807) |
| folio-assistant-8m1j | `smart-trust-data-store-fixes-2026-11-01.md` | project | Draft PRs fixing WHO smart-trust#146, smart-trust-phw#22, smart-base#338 in litlfred forks; how sushi was run offline |
| folio-assistant-8n0n | `gdhcn-onboarding-game.md` | project | GDHCN "Join the Network" game (carlsbox/gdhcn-onboarding-game) becoming a chrome-less smart-trust visualiser on gh-pages; issue smart-trust#176, cards Q-GAME-1..4 |
| folio-assistant-8nm4 | `committee-content-no-merge.md` | feedback | Change-set PRs that change document content (e.g. dth-hrh CS-001) are committee decisions; never merge them, and keep their issue open |
| folio-assistant-8pg0 | `bpmn-readable-2026-10-31.md` | project | BPMN readable-at-100% work (2026-10-31): merged PRs, open detangle/split PRs, and tool gotchas |
| folio-assistant-8q8d | `dth-hrh-cde-nhwa-design.md` | project | DTH-HRH data elements = core set (CDE-HRH) + one extension set per NHWA 2nd-ed module; design doc + cards Q-CDE-1..4 (2026-11-02) |
| folio-assistant-8sqp | `th-name-spelling.md` | project | Cast names respelled per Thai feedback (Somsack->Somsak, Chanthasone->Chanthason): smart-trust-demo #115/#116, vaxlink#16, card Q-THN-1 |
| folio-assistant-8vbm | `ig-content-qa-gate-330.md` | project | Injection QA gate for IG narratives/markdown (fhir-harness#330, PR #332): agent sidecar qa/ig-content-qa.json keyed to content digest, compose gate, browser re-check |
| folio-assistant-8xym | `document-back-matter-order.md` | project | User wants glossary+acronyms as back matter in every document; card Q-BM-1 (2026-11-02) on acronyms-as-glossary-subsection; smart-ra#230 |
| folio-assistant-8yzr | `dth-hrh-structured-authoring.md` | project | dth-hrh structured authoring (option D) and DTH production process (option E): decisions, PRs and next steps, 2026-10-31 |
| folio-assistant-90xf | `pipeline-queue-2026-11-01.md` | project | Thread "Speed up merge and CI pipeline" (2026-11-01 23:00Z): queue reprioritisation, cancelled-run list, analysis doc path |
| folio-assistant-92m6 | `dth-phc-glossary-sources.md` | project | dth-phc#6 option A result: draft PR #11 links 22 of 48 undefined PHC glossary terms to WHO/smart-ra/dth-hrh sources; Q-DTH4-1 open |
| folio-assistant-934v | `dth-overlays-not-model.md` | feedback | DTHs build ArchiMate/glossary overlays on smart-ra; never add DTH elements straight into the smart-ra model |
| folio-assistant-94i3 | `review-log-watchers.md` | project | Which thread watches which review log, and how a watcher stays awake (hourly scheduled task + 1-minute send_later chain) |
| folio-assistant-9954 | `hands-off-jose-ritika.md` | feedback | Drains work ONLY on issues opened by litlfred; leave all others (Jose, Ritika, bots) alone (user rule 2026-11-01 09:48Z) |
| folio-assistant-9a0n | `outside-lanes.md` | project | "Lane S" and "lane A" are Claude sessions outside this project that took over Folio PRs on 2026-10-22 |
| folio-assistant-9fo8 | `iris-subject-ingestion-plan-2026-11-10.md` | project | Plan for referenced (non-materialized) ingestion of IRIS HIV/immunization/vaccine items into who-iris KG; counts, sizes, cards Q-IRIS-1..7, PRs #208/#211 |
| folio-assistant-9nzt | `smart-ra-content-drafts-review-2026-11-11.md` | project | 26 smart-ra content drafts prepped for one-by-one review (Q-WRAP-2 C, Q-CRD-1 A); summary file + preview pattern; thread …E6HFb4KEYDjMgq6a8AyeRu |
| folio-assistant-9y5q | `smart-ra-dpi-h-ra-bibliography.md` | project | dpi-h-ra footnote citations -> KG references/ + \cite keys + generated References list (smart-ra#232, issue #231, 2026-11-02) |
| folio-assistant-9y9s | `staging-review-link.md` | project | How to reach a staging preview's review (diff) page, and the banner link (cat-harness-tools#1318, merged) |
| folio-assistant-a524 | `demo-right-rail-2026-11-12.md` | project | Q-RAIL-2/Q-TRP-3 single harness fix fhir-harness#390 (issue #389) - task panel loader + contentTypes.ig.trustedScripts; demo #128 pending |
| folio-assistant-a99o | `na-gates-1701-2026-11-08.md` | project | Platform-only gates report not-applicable in instance joined runs: cat-harness-tools#1701, PR #1705 (thread "Make platform-only gates report not applicable"); Q-NA-1 answered B |
| folio-assistant-aa2f | `business-processes-migration.md` | project | DTH migration to the business-processes kind (Q-SUBG-6 A): dth-pc#14, dth-phc#24 drafts; dth-hrh has nothing to migrate |
| folio-assistant-ai6q | `fa-main-red-core-glossary-2026-10-31.md` | project | fa main red 2026-10-31 after fa#2830: skill:register fails at glossary:page because core pin 00ae0ec's bpmn-activities glossary page is over budget; fix = re-pin core |
| folio-assistant-akc6 | `smart-trust-demo-jv03-style-review.md` | project | JV-03 journeys viewer vs VaxLink style review artifact, 23 differences D01-D23, Q-JV3-1 = A, beans jv04-jv18 pushed |
| folio-assistant-ap4q | `ig-ast-raw-url-325.md` | project | fhir-harness#325 steps 2+3, #329, #335 (2026-11-10): ALL MERGED by 19:20Z (#327 #328 #331 #338, tools#1763, fhir-ig-publisher#13, cat-harness#1195 skill git-friendly-churn); smart-immunizations 118 -> 71.1 MB |
| folio-assistant-apim | `demo-right-rail-2026-11-11.md` | project | smart-trust-demo "no right hand grill": 64rem CSS pushed .fa-sec-actions off-screen (tools#1897, PRs tools#1898 + cat-harness#1244) + stale fhir-harness pin |
| folio-assistant-aqrb | `dth-figures-rebuild.md` | project | dth-pc/dth-sc handbook figures - extraction state and the owner's rebuild choice (2026-10-31) |
| folio-assistant-aukb | `smart-trust-references.md` | project | smart-trust bibliography is references/<key>.json (folio-reference/v1 CSL) rendered into IG pages by input/scripts/references.ts; PR litlfred/smart-trust#123 |
| folio-assistant-aw7q | `review-log-feedback-clarity.md` | project | Why review-log Feedback (agent) cells read all-bold/unclear (2026-11-01) and the pending fix card Q-FBK-1 |
| folio-assistant-azlf | `dth-hrh-drafting-sheet.md` | project | Review-sheet Apps Script setup (one generic Code.gs + locked Config tab per sheet), the DTH-HRH Contributor Log and the two templates |
| folio-assistant-b0bs | `security-review-mvp-2026-11-01.md` | project | MVP security review DONE 2026-11-01 22:47Z: sr31, sb31, 33iz completed; only deferred owner bean nbp9 open |
| folio-assistant-be0f | `goal1-placement-2026-10-30.md` | project | State of the GOAL 1 placement beans (saqd, rfuq, f8wp, pzwb, 95sk, 4fv8) as of 2026-11-10 |
| folio-assistant-bt7v | `fhir-harness-main-green-2026-11-02.md` | project | Harness drain phase 1 (thread "Get fhir-harness main green"): root cause of cancelled main runs in every layer, PRs tools#1384 and fhir#273, card Q-HDR-2 |
| folio-assistant-bxc4 | `rail-icon-hover-2026-11-08.md` | project | Right-gutter 🔖/📣/🔗 hover tile fix (cat-harness#1134, PRs cat-harness#1135 + tools#1674, branch claude/rail-icon-hover) |
| folio-assistant-bzry | `qa-email-spam-2026-11-10.md` | project | 11-10 "Stop failing post-merge QA emails" thread: why layer mains are red, main-qa email fix PR, Pages timeouts |
| folio-assistant-c4t7 | `block-qa-own-only-2026-11-08.md` | project | translation:block-qa judged cat-harness docs in content repos' pin PRs; fix cat-harness-tools#1685 (issue #1684) scopes it per gate-own ruling |
| folio-assistant-c5y7 | `s9b-bpmn-guidance-part-two.md` | project | S9B thread (2026-11-01/02) BPMN guidance PRs for fhir-harness, sci, who-iris, smart-base: all merged; leftover stale sci .pot files |
| folio-assistant-c63o | `slash-iris-rollout.md` | project | Q-SLASH-1 = A (2026-11-02 06:25Z): every own namespace incl. BPMN processes xmlns and ig-ast goes ns# -> ns/; plan + branches claude/slash-iris |
| folio-assistant-cczq | `content-split-step1-2026-11-08.md` | project | Content split step 1 (bean 0r7u, split by caller) PRs core#676 + cat-harness#1136 on hold until core/cat-harness mains green |
| folio-assistant-cep2 | `smart-fp-sushi-2026-11-10.md` | project | smart-fp XML IG converted to sushi/FSH (litlfred/smart-fp#3, Q-FP-1 card); JSON match results and how it was checked |
| folio-assistant-cesa | `no-2015-mds.md` | feedback | WHO 2015 HRHIS MDS (9789241549226): never use the data set as a model or make it computable; ingest ONLY its functional requirements as inspirational L1 reference |
| folio-assistant-cj6x | `held-subscription-trees-no-merge.md` | feedback | Never merge a PR that edits files under subscriptions/*/ (held, fixity-checked copies); cat-harness#936 broke staging on 2026-11-02 |
| folio-assistant-cn9z | `dth-sfp-workplan-status.md` | project | dth-sfp#1 workplan status: who-iris#154, cat-harness#889, smart-base#280 and #284 all merged 2026-11-02; workplan done except dth-sfp#8 |
| folio-assistant-co5e | `fa-main-red-2026-11-01.md` | project | State of the "Fix red checks on fa main" thread (main reds across repos), as of 2026-11-02 04:40Z |
| folio-assistant-cq1k | `take-over-stalled-work.md` | feedback | Standing rule: if another agent's PR/bean has had no work for more than 2 hours, a drain thread may take it over |
| folio-assistant-d304 | `nhwa-committee-staging.md` | project | NHWA is not in smart-ra (owner 2026-11-01); NHWA ArchiMate elements move to a DTH overlay in litlfred/dth-hrh |
| folio-assistant-d765 | `split-slow-gates-s-ci6.md` | project | S-CI6 (2026-11-01): split check:cat-harness-tools-standalone into 4 parts and stop skill:register re-runs in gate shards; tools#1233 |
| folio-assistant-decn | `review-page-inline-default-2026-11-02.md` | project | Review page inline default, back link, named anchors; 🔗 icon on doc pages; check-anchors QA (cat-harness-tools#1383, #1388, cat-harness#957) |
| folio-assistant-dhls | `smart-trust-demo-journeys-rename.md` | project | smart-trust-demo #111/PR #112: VaxLink app retired, "journeys" wording, parity beans JV-01..03; card Q-JRN-2 (merge) |
| folio-assistant-djgx | `iris-extraction-fixes-2026-11-11.md` | project | IRIS extraction fixes + errata (Q-ODD-1 = A): PRs, sequencing, and the authored sidecars a re-derive keeps |
| folio-assistant-dtfs | `gdhcn-trust-domain-terms-of-use.md` | project | Q-VC-2 A (2026-11-01): VHL VC receivers name trust-domain policies in VC termsOfUse; each GDHCN trust domain has a terms-of-use ValueSet; Admin Framework is the L1 legal glossary source |
| folio-assistant-dvwr | `bpmn-layout-overlaps-2026-11-02.md` | project | Harness BPMN overlap redraw (2026-11-02): cat-harness#989/#990, bean bpnl, card Q-LAYOUT-1, generator in project files |
| folio-assistant-dwf1 | `voiceover-chatterbox.md` | project | Q-VO-1 = A (2026-11-11): Chatterbox Multilingual (MIT) chosen for game narration in 6 UN languages; sandbox setup and gotchas |
| folio-assistant-e0i4 | `actions-runtime-2026-11-10.md` | project | 11-10 Actions run-time/init analysis (Docker image question): numbers, card Q-ACT-1, data path |
| folio-assistant-e3w5 | `ig-references-kg-migration.md` | project | IG/folio references pages -> KG bibliography (owner 2026-11-02): no references.html, one KG Bibliography page per document, check:ig-citations gate |
| folio-assistant-eahf | `shard-balance-s-ci1.md` | project | S-CI1 (2026-11-01) layer-pr-checks shards split by wall time; core uses 5 shards (8 was tried and was slower because of runner queueing) |
| folio-assistant-ebo0 | `open-work-inventory-2026-11-09.md` | project | 2026-11-09 10:45Z open beans/issues count (50 beans, 89 harness issues), file path, card Q-INV-1 options |
| folio-assistant-eil7 | `gdhcn-onboarding-game-translations.md` | project | GDHCN onboarding game translations ar/es/ru/zh merged 2026-11-11 (smart-trust#184-187); method, gates and gotchas |
| folio-assistant-eub9 | `tamper-toggle-j3a.md` | project | Restoring VaxLink's live screen toggles in the journeys viewer: device-screen states (tools#1896) + S1–S8 content (smart-trust-demo#123); Q-TMP-1/2 = A |
| folio-assistant-ewqa | `copy-page-build.md` | feedback | How to build the Code.gs copy page from main + open review-sheet PRs without merging stale branch refs |
| folio-assistant-f7z8 | `processes-subgraph-pages.md` | project | Per-subgraph Processes pages (processes/<instance>/) never existed; added 2026-11-01 in tools#1312 + cat-harness#930; smart-trust BPMNs blocked by interpreter (Q-SUBG-2) |
| folio-assistant-fofz | `merge-manager-2026-11-08.md` | project | Merge master window 2026-11-08 06:42Z-19:00Z (card Q-MM-1 A); non-content only, dth-*/smart-ra content held; thread …HtujCofFVVPVPppfDRTSNR |
| folio-assistant-fozt | `ingestion-fidelity-mvp4.md` | project | MVP sibling #4 (ingestion fidelity, Phase 3) state 2026-11-01: dth-phc#27 who-iris repin, ls3t in smart-base#249, card Q-ING-1 |
| folio-assistant-fusv | `journeys-viewer-parity-jv.md` | project | Journeys viewer parity JV-01..18 in cat-harness-tools (issues #1867, #1869; PRs #1868 #1870 #1871 #1873 merged, #1874 #1875 open); content waits on one re-pin |
| folio-assistant-fvm7 | `fa-2864-shards-3-4.md` | project | fa#2864 bun test shards 3 (declared-path literals) and 4 (uncited e0jh papers) fixes, PRs and the awaitingCitation field, 2026-11-01 |
| folio-assistant-g2bi | `chain-repin-guideline-updates.md` | project | 2026-11-01 pin audit (3/134 pins on latest), chain re-pin tool plan (repin:cone), and the "Guideline Updates" process (people + technical); Q-PIN-1/2 |
| folio-assistant-g2es | `sushi-in-sandbox.md` | reference | How to run sushi in a cloud sandbox where packages.fhir.org is blocked (seed ~/.fhir/packages from fhir-package-mirror + npm) |
| folio-assistant-gdav | `dth-l2-repos.md` | project | The four IRIS DTH handbooks, their repos (WHO upstream + litlfred forks, created 2026-10-31) and the L2-on-smart-ra workplan |
| folio-assistant-gls8 | `who-template-404-2026-11-08.md` | project | WHO template who.template.root#current 404s on build.fhir.org (branches/main), breaking IG AST refresh on smart-* mains; card Q-TPL-1 |
| folio-assistant-h4fi | `smart-ra-remaining-figures.md` | project | Thread "Make remaining DPI-H RA figures computable" (2026-11-01 17:49Z) - figure inventory, skips, branch, Q-RAFIG cards |
| folio-assistant-h5ud | `rerun-policy.md` | feedback | Owner Q-RERUN-1 = B (11-12 06:31Z): merge manager re-runs CI only right before merging; never on held content; wait for GitHub healthy; refresh re-pin pins first |
| folio-assistant-h8jd | `ci-gate-issues-2026-11-09.md` | project | Thread "Fix CI and gate issues" (11-09): state of cat-harness#1150, tools#1680, fa#937, fa#2881 and the PRs opened |
| folio-assistant-h8l5 | `review-sheet-copy-page.md` | project | How to republish the review-sheet Code.gs copy page after a core merge (no thread owns it) |
| folio-assistant-h9d1 | `subgraph-optin-links-2026-11-11.md` | project | 11-11 follow-up to opt-in subgraphs: links gate on in CI, cleanup PRs, fa#3069 re-pin MERGED 13:00Z, tools#1900 slice fix merged; thread done |
| folio-assistant-hau0 | `smart-trust-trust-network-figure.md` | project | Thread "Make trust network diagram computable" (2026-11-08) - smart-trust trust_network.png, card Q-TN-1 |
| folio-assistant-hh4b | `publish-pages-reuse-2026-11-01.md` | project | fa#2882 (issue #2880): main deploy reuses merged PR's cqg publish-pages artifact (derive:publish) with 4 checks; thread "Reuse PR pages in main deploy" |
| folio-assistant-i9fv | `archimate-straight-lines.md` | project | ArchiMate view line straightening (render-view.ts routeConnections) - issue cat-harness-tools#1886, PR #1887, card Q-ARR-1 (2026-11-11) |
| folio-assistant-ia3p | `who-iris-search-page-2026-11-08.md` | project | who-iris IRIS-style search page (issue #196, draft PR #197); translation round-trip attestations must land in step with new site strings |
| folio-assistant-iaut | `pc-release.md` | project | Frozen "Draft for Public Comment" releases at gh-pages PC/<version>/ plus a line-numbered PDF (cat-harness-tools#1145) |
| folio-assistant-ifc7 | `core-main-red-2026-11-01.md` | project | Why folio-assistant-core main push runs are red (42 lower-layer gates in the mounted index), the 10 fixing PRs, Q-CMR-1/2/3, and how to reproduce CI's index locally |
| folio-assistant-ifqu | `task-panel-skill-links-2026-11-08.md` | project | BPMN ⓘ task panel skill links — skills without instruction pages get processes/skills/<name> pages from source; QA page panel-links-qa; merged cat-harness-tools#1679 |
| folio-assistant-ifx2 | `platform-leftovers-2026-11-08.md` | project | 11-08 thread "Clear small platform leftovers" (…LgKFyTqSdjwVs6ULk3L9Mv): state of smart-base#281, who-iris#104, core#461, pilgrimage#13; cards Q-LO-1/2 |
| folio-assistant-igc4 | `cs-013-hrh-split.md` | project | dth-hrh #64 split (CS-013/#76) into committee change sets #78/#81 BPMN, #79/#82 personas, #80/#83 DMN, #84/#85 glossary; checks in core#515 |
| folio-assistant-iiwa | `who-migration-hardcode-review.md` | project | 2026-11-11 review of hard-coded "litlfred" before moving smart-*/dth-* repos to WHO; report path, key findings, open cards Q-MIG-1/2 |
| folio-assistant-ik4a | `build-types.md` | project | Build types "preview" (STAGING: only changes, no reindex) vs "full" (main, PC public comment, release); thread S-CI5, started 2026-11-01 |
| folio-assistant-ip4l | `agent-built-previews.md` | project | Agent-built fa previews verified by a full CI rebuild (Q-SPD-9 B, Q-SPD-9b A): issue fa#2881, PRs tools#1290 + fa#2885, open card Q-ABP-1 |
| folio-assistant-iqbx | `who-int-bar-controls-2026-11-10.md` | project | Top bar search + language restyled like who.int (cat-harness#1207 code, tools#1792 e2e, issue cat-harness#1206) |
| folio-assistant-j0c5 | `archimate-not-skos-source.md` | feedback | User rule 2026-11-02 - an authored ArchiMate model must never be the source of SKOS glossary content; only an ingested model may be |
| folio-assistant-jdw2 | `fhir-rail-row.md` | project | [fhir] left-nav row for FHIR IG renders: cat-harness-tools#1186 merged 2026-10-31 (b5e81dc); staging check waits on an fa tools re-pin |
| folio-assistant-jixd | `who-iris-cdn-exporter.md` | project | Owner's decisions (2026-10-30) for the WHO IRIS CDN Exporter: Cloudflare hosts exports, GitHub Pages only previews |
| folio-assistant-jjwk | `onboarding-game-smart-trust.md` | project | GDHCN "Join the Network" game in smart-trust as a web-app kind; PRs, decisions, translation setup (2026-11-11) |
| folio-assistant-jrg9 | `aai-programme-who-move.md` | project | State of moving litlfred/aai-programme into WorldHealthOrganization/aai-programme and the PM's objections (2026-10-26) |
| folio-assistant-jxsu | `public-comment-channels.md` | project | Public-comment release channels (Excel, Google Form, GitHub issue form, review sheet) and their intake; skill + tool in folio-assistant-core |
| folio-assistant-jyv2 | `sheet-column-moves.md` | feedback | Never insert/delete/move review-sheet columns while the Apps Script timer may be running; how DPI-H lost ~200 proposals |
| folio-assistant-k8nn | `meta-merge-2026-11-02.md` | project | Meta-merge process (runners full): one merge-commit branch per repo, merged without CI; first run 11-02 07:03Z on 3 harness repos |
| folio-assistant-k8u8 | `lsi-page-rework-2026-11-08.md` | project | follow-ups B+C2 in draft PRs 11-10 (cat-harness#1197, core#710/#711/#712); orig DONE 11-10 — LSI page → "Indexing evidence" (cat-harness#1144) + keywords built at publish in 6 variants; PRs, decisions; thread cmsg_017WNUkNK8kdDziPK58Pv6G95xcPV1zXPt2N1Twnrpakp3 |
| folio-assistant-kch5 | `bookmark-selected-state-2026-11-09.md` | project | Pressed 🔖 gutter bookmark gets a persistent tile + accent ring (issue tools#1745, PRs cat-harness#1174 + tools#1746) |
| folio-assistant-kiy1 | `smart-ra-computable-figures.md` | project | Review of which smart-ra figures/tables can be generated from ArchiMate/FSH/KG (2026-11-01), cards Q-RAC-1..3 |
| folio-assistant-kn26 | `issue-author-rule.md` | feedback | Agents work only on GitHub issues opened by litlfred; never touch issues from Jose, Ritika or anyone else |
| folio-assistant-kzm3 | `preview-derive-slow-s-ci2.md` | project | Why fa previews' derive step takes 10-13 min (QA working copy built inside uml:overview; skill:register re-runs 9 checks), fix fa#2867 |
| folio-assistant-l19y | `speed-deep-review-2026-11-02.md` | project | 2026-11-02 follow-up to the speed review: projecting the root "." read saves under 3 s; real derive wins are cascades and unrecorded writers |
| folio-assistant-l885 | `platform-leftovers-2026-11-09.md` | project | 11-09 thread "Clear small platform issue leftovers" (…Wgnuvn3Tp7VT2NxFygsoV4): fhir-harness#316, who-iris#104, pilgrimage#13/#51 state; cards Q-LO-6/7 |
| folio-assistant-lm5l | `colored-json.md` | project | Syntax-colored JSON across harnessed sites — issue cat-harness#1241, PR #1242, Q-JSON-1 = B (highlight.js, dynamic load) |
| folio-assistant-luxq | `ig-thin-pages-toc.md` | project | IG left-nav TOC missing on thin pages (artifacts/toc/artifact/*/IG API hub); fix fhir-harness#279 (issue #278), 2026-11-02 |
| folio-assistant-lwdn | `who-forks-harness-2026-11-10.md` | project | Harnessing the 10 new litlfred WHO forks on smart-base (card Q-JTD-2 A): PR numbers, sushi status, blockers |
| folio-assistant-lwnb | `platform-dispatch-2026-11-08.md` | project | 2026-11-08 09:30Z platform backlog dispatch (thread "Work down platform backlog" …D2Exka7whCUnsTgxVB6cb9): 3 sibling threads asked, what was skipped |
| folio-assistant-lwuw | `dth-pc-sc-contributor-logs.md` | project | DTH-PC and DTH-SC Contributor Log sheet IDs and setup state (2026-10-31) |
| folio-assistant-m4n1 | `subgraph-groupings-2026-11-10.md` | project | Q-SG-1 C (owner 17:16Z 11-10): lighter mounts + all cat-harness/core content groups opt-in in waves; all 9 PRs merged 18:40Z; downstream enable + re-pins left |
| folio-assistant-m9ad | `smart-ra-content-drafts-review-2026-11-12.md` | feedback | Owner Q-RA-VAL-2 A (11-12 06:12Z): approved smart-ra drafts merge with check:corpus-gate red, waived by approval taps; agents must not fabricate editing-hci-validation person steps |
| folio-assistant-mapv | `platform-ci-speed-prs-2026-11-01.md` | project | CI stability thread's open speed/cleanup PRs (2026-11-01 late) and the fa main reds they expose; continuation of platform-ci-stability-2026-11-01 |
| folio-assistant-mn3z | `smart-html-jtd-landing-2026-11-10.md` | project | smart-html-jtd landing page restyled like smart.who.int publications table (PR #7, issue #6), in IG theme |
| folio-assistant-moct | `review-sheet-multiselect.md` | project | Selected Sections "Invalid" on drafting logs = Allow multiple selections tick off; API cannot set it on a range rule |
| folio-assistant-mwfh | `g196-preview-slim.md` | project | Bean g196 / cone row 2 (2026-10-31, sibling S1): previews already share via staging-share normalising; real churn is the KG build stamp on main; tools#1208 |
| folio-assistant-mzbu | `dark-toggle-stale-previews-2026-11-08.md` | project | Missing bulb (dark/light) on STAGING previews = stale preview built before navbar-row.js got liteSchemeButton (~11-01); not a template bug |
| folio-assistant-n4w8 | `smart-ra-drafts-green-2026-11-12.md` | project | Thread "Green the smart-ra drafts" (…6fbDk8ZG5kaLTpD1m7m7RP) 11-12: 21 smart-ra PRs red; causes, conflicts (#195 card Q-RA-MRG-1, #199 resolved locally), waiting on smart-ra re-pin |
| folio-assistant-n915 | `itb-deployment-2026-11-10.md` | project | Where ITB deployment docs/process/skills live; draft page cat-harness#1175 with owner questions Q-ITB-1..4 |
| folio-assistant-nbtb | `publish-standard-practice.md` | feedback | New sites publish via the platform's standard gh-pages route; any deviation is a card for the owner first |
| folio-assistant-o03d | `bpmn-task-name-slugs.md` | project | Q-RED-3 B (2026-11-01): dropping trailing [skill] slugs from BPMN task names; PRs, rule used, how derived files were refreshed |
| folio-assistant-o6rs | `smart-html-jtd-2026-11-08.md` | project | litlfred/smart-html-jtd (non-fork) = merged just-the-docs site for SMART IGs; sizes measured 2026-11-08; design PR #2 |
| folio-assistant-o7nv | `rail-fold-families.md` | project | Rail Pages tree folds "Bibliography: …"/"Tools — …" rows (cat-harness-tools#1262); smart-ra#213 re-pin saga and the 6 red gates follow-up, 2026-11-01 |
| folio-assistant-obux | `dth-front-matter-page-furniture.md` | project | dth-* seeders copied the PDF front matter verbatim (printed TOC, cover repeat); dth-phc fix and gate to port to other DTHs |
| folio-assistant-oeg2 | `pilgrimage-home-journey-2026-11-11.md` | project | smart-ips-pilgrimage home page = pilgrim's journey; pilgrim-journey page removed (issue #64, PR #65); card Q-PIL-5 |
| folio-assistant-oepg | `gdhcn-bpmn-reuse-onboarding.md` | project | GDHCN BPMN reuse (Q-BPMN-1..5) and smart-trust onboarding BPMN (Q-OB-1..4): decisions and draft PRs smart-trust#113, phw#24 |
| folio-assistant-oisn | `ig-qa-json-carry-2026-11-10.md` | project | Why IG sites (smart-dak-pnc + WHO forks) show "no qa.json" on qa.html, and the fhir-harness#355 fix |
| folio-assistant-omuo | `dpih-lab-discuss-weave.md` | project | DPI-H Lab (dpih.fhirlab.net) 8 steps as the journeys Discussion view: cat-harness-tools#1892 + smart-trust-demo#121 both merged 2026-11-11 |
| folio-assistant-on9m | `no-preview-repos.md` | feedback | User does not want PR previews moved to a separate GitHub Pages repo (Q-SPD-5 B withdrawn 2026-11-01) |
| folio-assistant-oo7c | `archimate-ra-backlinks-2026-11-12.md` | project | ArchiMate pages of IGs/DTHs that reuse smart-ra elements link back via overlay:base (tools#1950, smart-trust-demo#133); legacy IRI form |
| folio-assistant-ou0y | `codegs-copy-page.md` | feedback | Code.gs updates go ONLY via the copy page artifact; updateFromGitHub is broken (user 2026-11-01 16:05Z) |
| folio-assistant-pbfo | `folio-left-gap-icons-2026-11-08.md` | project | "Grill" = the .75rem backdrop band between folio LHS navbar strip and white content (NOT the icon strip); fixed in tools#1682 + cat-harness#1137; reaches a site only via cat-harness re-pin |
| folio-assistant-pblp | `ci-email-storm-2026-11-12.md` | project | 11-12 "Stop the CI failure email alerts" thread: 120 emails traced, cause classes A–L, fix PRs, re-run amplification |
| folio-assistant-pghh | `first-harness-pr.md` | feedback | A repo's first harness PR (adds index.lock.json) is red by construction until cat-harness-tools#1235 merges; the owner approved merging it, and wants it to be green |
| folio-assistant-plv2 | `ig-desc-markdown-375.md` | project | Raw **bold**/lists on IG artefact pages (smart-trust-demo actors) = fhir-harness ig-artifact.js description() gap; issue #374, PR #375 |
| folio-assistant-pog6 | `smart-ra-drain-2026-11-01.md` | project | smart-ra issue drain 2026-11-01: only litlfred-opened issues are touched; triage result, #181 fix, open cards Q-RAD-1/2 |
| folio-assistant-q5sw | `bib-entry-pages-2026-11-08.md` | project | Bibliography entries get slash pages + side panel, no #ref- anchors (owner A + "clean break", 2026-11-08); core#678, sci#185 |
| folio-assistant-q9rj | `review-page-sbs-2026-10-31.md` | project | Change-review page side-by-side fix (2026-10-31): where the code lives, the PRs, and the pending merge card |
| folio-assistant-qpyq | `methodology-prose-links-2026-11-10.md` | project | cat-harness-tools#1748 links methodology names/library paths on the methodologies page and fixes evidence links on IG sites |
| folio-assistant-qxnv | `dth-sc-sc3-sc5.md` | project | dth-sc#2 last steps (2026-11-01): SC3 variant views overlay PR dth-sc#10, SC5 owner sign-off PR dth-sc#12, cards Q-DTH1-1..3 |
| folio-assistant-r5oj | `pin-conflict-resolution.md` | feedback | When merging main into an fa branch, resolve index.config.json/index.lock.json per instance, never whole-file --ours |
| folio-assistant-r9d9 | `fa-preview-gate-drafts-2026-11-08.md` | project | 2026-11-08 thread "Finish fa preview and gate drafts": fa#2953/#3004/#3018 merged main + pushed; card Q-RDY-1 (mark ready) open |
| folio-assistant-rcqp | `glossary-kg-linkage-survey.md` | project | 2026-11-01 survey of glossary/KG linkage (dpi-h-ra example); join keys agreed; Q-GLO answered (1C, 2A, 3C) |
| folio-assistant-rfi0 | `who-iris-item-links-dc-2026-11-10.md` | project | who-iris replica stale live site (covers), item links to WHO IRIS (who-iris#205), Dublin Core link on library entry pages (tools#1752), 2026-11-10 |
| folio-assistant-rg3j | `structured-block-cards.md` | project | Light card styling for structured blocks (FR/NFR/persona/scenario/DE) in document sites, 2026-11-01; where the code lives and open PRs |
| folio-assistant-rhkg | `site-publish-on-merge.md` | feedback | Owner rule 2026-11-10 - folio sites publish on every push to main (site-publish.yml on push + dispatch); documented in merge-to-main Task_Republish |
| folio-assistant-rnaj | `dark-toggle-body-2026-11-08.md` | project | Bulb toggle on folio-rail jtd pages repainted only the rail, not body/tables/code until reload; fix in cat-harness navbar-row.js (branch claude/dark-mode-toggle-body) |
| folio-assistant-sg9b | `rail-fold-declared-menu-2026-11-10.md` | project | IG LHS rail expand/collapse broken (flat declared menu, dead ▸); fix tools#1777 + cat-harness#1201 (issue tools#1776) |
| folio-assistant-sgz9 | `pinned-inputs-s2.md` | project | Bean-drain S2 "Make builds read only pinned inputs" (2026-10-31): FHIR index pin status, AST cache staleness, preview blob 404 fix, open Q-S2-1/Q-S2-2 |
| folio-assistant-srqa | `writer-rerun-on-repin-2026-11-01.md` | project | Q-SPD-4 B (2026-11-01): why derive:publish writers rerun on a tools re-pin; tools#1265 issue, draft tools#1267 (getdents traced), card Q-CONE-1 |
| folio-assistant-ss6x | `review-log-preview-columns.md` | feedback | When a change set's PR or preview changes, write the Agent tab row (not only Feedback (agent)) so Staging review/Agentic status update |
| folio-assistant-sv1a | `fa-drain-2026-11-01.md` | project | folio-assistant bean/issue drain 2026-11-01 09:50Z: who owns which item, siblings asked for, rule "only litlfred's issues" |
| folio-assistant-swl0 | `sibling-hand-back.md` | feedback | Sibling threads/subagents must hand every card, question, result or blocker back to the discussion agent (skill hand-back-to-discussion), never leave it only in their own thread. |
| folio-assistant-sych | `derived-uml-smart-ra.md` | project | Derived-UML work for smart-ra (owner chose option A 2026-10-31): PRs, issues, what waits on what |
| folio-assistant-t0bn | `iris-figures-2026-11-11.md` | project | who-iris figure descriptions + figure/table extraction 2026-11-11 — who-iris#229 (issue #224), tools#1850, cards Q-FIG-1/2/3, gotchas |
| folio-assistant-t3cb | `kg-step-changed-only.md` | project | Sibling S-CI4 (2026-11-01): KG step 160 s on main; rail pass memo tools#1222, locale --core tools#1226, fa#2868 workflow + re-pin |
| folio-assistant-th0p | `library-chain-f1nc-2026-11-08.md` | project | Library sub-graph chain cat-harness#1032 -> core#639 -> fa#3016 (bean f1nc): why layer PRs are red alone, current pins, card Q pending |
| folio-assistant-tx6r | `bpmn-guidance-review-2026-11-01.md` | project | Harness BPMN review vs new guidance (2026-11-01): shared blocks G1-G10, PR status, open cards Q-BR-8 |
| folio-assistant-tyee | `x80s-c2pa-part2.md` | project | x80s drain C2PA part 2 (prose-s406..s771): 7 PRs fa-core #534,#535,#537-#541, state as of 2026-11-01 |
| folio-assistant-ub52 | `drain-s7-2026-11-01.md` | project | Drain sibling S7 (thread cmsg_017WNUkNK8kdDziPK58Pv6G9Vf1jcKtsbBiryn9DW8Nrkz) PRs, superseded items and open cards Q-S7-2/3 |
| folio-assistant-ubqu | `idle-harness-issues-2026-11-02.md` | project | Thread "Finish idle harness issues" (Q-HDR-3 A): tools#1259, #400 box 4, #1299 — PRs and state |
| folio-assistant-ubrt | `merge-safety-check.md` | project | Claude sessions' auto-mode safety check blocks PR merges and issue closes even inside the owner's merge windows |
| folio-assistant-ubym | `corpus-gate-change-sets.md` | project | Fix for check:corpus-gate failing on every change-set PR (dth-hrh CS PRs), Q-GATE-1 A, tools#1329, open Q-GATE-2 |
| folio-assistant-ufn8 | `repin-train-2026-11-01.md` | project | How the fa re-pin train (issue fa#2873) works, its traps, and its state as of 2026-11-02 16:30Z (train #2921) |
| folio-assistant-uwxe | `dmn-site-render.md` | project | Decision tables on document sites are drawn from the .dmn (Q-DMN-1 A): cat-harness-tools#1324, marker, refusal rule, dth-hrh follow-up |
| folio-assistant-uxx6 | `ci-bottlenecks-2026-11-08.md` | project | 2026-11-08 CI/merge bottleneck review (thread "Cut merge and CI bottlenecks"): numbers, report link, Q-CIB-1/2 picks, PRs tools#1677 #1681 |
| folio-assistant-uy70 | `issue-authors-off-limits.md` | feedback | Drain only issues opened by litlfred; never touch others' (Jose, Ritika, anyone) (user 2026-11-01 09:48Z) |
| folio-assistant-v4cn | `figure-table-layout-2026-11-01.md` | project | Owner's figure/table look for every document site (hover controls, centred, titles <=66%), where it lives, and dth-pc staging gotchas |
| folio-assistant-v4dz | `fa-health-watchdog-red-2026-11-08.md` | project | Why folio-assistant "Repository health watchdog" goes red on some days (addQa vs reader resolution) and the fix tools#1683 |
| folio-assistant-vkb0 | `smart-ra-integrated-view.md` | project | smart-ra Fig 3.5 "Integrated View" computable rebuild - coverage findings and open cards Q-IV-1/2 (2026-11-01) |
| folio-assistant-vosx | `ci-speed.md` | project | State and decisions of the CI/render/merge speed work (layer-pr-checks, cone, verdicts, repins) as of 2026-10-16 |
| folio-assistant-vt2w | `archimate-contents-card.md` | project | IG-style Contents card on ArchiMate pages — cat-harness-tools#1885 / PR #1888 (shared contents-card.js in scripts/templates) |
| folio-assistant-vugr | `stage-timeout-who-iris-references.md` | project | fa feature-staging Jekyll >45 min since 11-11 — who-iris#226 per-document references (~7.5k) rendered in main + every IG bibliography |
| folio-assistant-vuu4 | `slim-rail-cone.md` | project | Thread "Move left-nav into one shared file" (2026-10-31, done): rail already shared; real per-page nav churn was jtd-nav-activation; fixed by tools#1107, live via fa#2839 |
| folio-assistant-vv6k | `smart-trust-tools-drain-2026-11-01.md` | project | 2026-11-01 drain of smart-trust-tools OI beans and smart-* issues: upstream status, PRs #43/#44, cards Q-STT-1..4 |
| folio-assistant-w3xx | `nondeterministic-writers-s-ci3.md` | project | S-CI3 (2026-11-01): which derive:publish writers write different bytes every run, fixes (fhir-harness#257, cat-harness-tools#1231), and how to measure locally |
| folio-assistant-w4jh | `layers-move-caller-gap.md` | project | Repos without .github/workflows/layers-move.yml can't take a sandbox re-pin (Layers cache ref check times out); user script adds it (2026-11-11) |
| folio-assistant-w7uj | `bibliography-own-first.md` | project | Bibliography page shows the site's own references first, dependencies in a labelled section (core#574 merged, live on smart-ra 2026-11-02) |
| folio-assistant-wc3m | `dth-content-drafts-review-2026-11-11.md` | project | 25 dth-* content drafts brought up to date 11-11 for one-by-one owner cards (Q-WRAP-2 C); report path, flags, previews pending mirror |
| folio-assistant-wla1 | `repo-roles-harness-vs-instance.md` | project | Which litlfred repos are harness layers vs content instances (checked 2026-11-08); "instance" in schemas means any declared layer |
| folio-assistant-wmmg | `merge-repin-windows.md` | feedback | How litlfred grants "merge and repin" windows and how Claude records consent for repins |
| folio-assistant-wpt1 | `smart-ra-phc-glossary-200.md` | project | smart-ra#200 PHC glossary alternatives: draft PR #204 stacked on #183, and the PHC quote errors found on #183 |
| folio-assistant-wrqs | `who-sync-plan.md` | project | 2026-10-23 trial-merge results and sync plan between WorldHealthOrganization/smart-* and litlfred/smart-* (thread "WHO migration prep") |
| folio-assistant-wyqi | `cs-007-l2-pilot-plan.md` | project | CS-007 (dth-hrh#47 L2 pilot) plan of changes 2026-11-01: draft PR dth-hrh#75, Q-L2P-1, sheet row numbers, beans location |
| folio-assistant-xm34 | `bpmn-gblocks-b1-2026-11-01.md` | project | BPMN helper B1 (2026-11-01..02): landed G-block PRs; Q-BR-8 = F (Beans data store); tools#1381 then G5 |
| folio-assistant-xowb | `platform-ci-stability-2026-11-01.md` | project | Thread "Stabilise platform state and CI" (MVP Phase 2c): main green ledger script, who owns which main red, 7mwa test/results PRs |
| folio-assistant-xpla | `smart-ra-library-stale-pins-2026-11-11.md` | project | smart-ra library pages look old (unthemed en/folio-assistant-core/library/) because of stale pins + publish-by-hand; smart-ra#240, card Q-RAL-1 |
| folio-assistant-xpou | `epic-audit-2026-11-01.md` | project | 2026-11-01 11:15Z audit of old epics (1xhc,0lmb,slw1,5a3l,vuip,yj32,npuo,3fva,fs43) + fa#223; cards Q-EPIC-1..5 and where each bean lives |
| folio-assistant-xq9j | `staging-preview-speed.md` | project | Thread "Get staging previews under 5 minutes" (2026-10-31): analysis doc, measured timings, pending option card |
| folio-assistant-y0ru | `smart-ra-block-panel-2026-11-02.md` | project | smart-ra edit/suggest panel wonky on lazy themed page: core scopeCss bug (core#612, held for freeze) + stale smart-ra pins lacking 🔗 anchors |
| folio-assistant-y63k | `staging-previews.md` | feedback | Folio PR previews and the review sheet's Agent tab rules: preview per push, status, dispositions, QA gate, Agent step |
| folio-assistant-y7jl | `writer-records-incremental-2026-11-08.md` | project | Option D of CI bottleneck analysis (derive:publish skip records per main push) — tools#1702, local branch, waiting on swarm hold release |
| folio-assistant-y7mt | `who-template-fhir2-migration.md` | project | WHO smart-ig-template still on deprecated fhir.base.template; #67/#68/#69/#70 status, gap report 11-09, card Q-TPL-2 |
| folio-assistant-ycp5 | `dsa-smart-trust-server.md` | project | DSA server-side processes and the ODRL-to-Permission renderer go in litlfred/smart-trust-phw (owner 2026-10-30 19:59Z), not a new smart-trust-server repo |
| folio-assistant-yn06 | `schema-pages-2026-11-10.md` | project | Readable schema pages for every layer + library-iri page + keyword link (tools#1751) and library entry folder guide (core#700), 2026-11-10 |
| folio-assistant-yqdf | `content-pause-smart-ra-dth.md` | feedback | Owner rule 2026-11-01 15:39Z - no content work on smart-ra or any dth-* repo; other smart-* content OK; functional fixes OK |
| folio-assistant-yz7s | `ig-contents-card-2026-11-10.md` | project | IG Contents card on the right (Artifacts Summary layout C + narrative pages) and </br> fix — fhir-harness#361 / PR #362 |
| folio-assistant-z0a0 | `glossary-organizations-acronyms.md` | project | How organizations and acronyms go in handbook glossaries (option B, SKOS + W3C ORG, 2026-10-31) and the PRs for it |
| folio-assistant-zkjy | `derived-test-results-in-mounts.md` | project | Since cat-harness#857 (test/results not committed), downstream gates can go unknown/order-dependent; how tools#1198 handles test runs, and the open follow-up |
| folio-assistant-zsd5 | `tools-queue-green-2026-11-12.md` | project | 11-12 tools PR queue (#1916,#1921,#1924,#1926,#1932,#1934-1936) red causes: two flakes fixed by #1937/#1938; how to read "new failures" |
| folio-assistant-zt1f | `goal5-content-model.md` | project | State of GOAL 5 content-model beans (npuo, 0lmb, slw1, x80s) and the summary backlog, as of 2026-11-01 |
| folio-assistant-zttv | `hydrated-mount-flake-2026-11-08.md` | project | Root cause of the remote-mount H1-H6 CI flake (real github.com curl), fixed in tools#1712; curl download limits merged in tools#1715 (11-11) |
| folio-assistant-zu6n | `harness-drain-o161-takeovers.md` | project | 2026-11-02 phase 3 of harness drain (bean o161): takeover state of tools#1129, tools#1359, cat-harness#932; Q-O161-1 = A (merge all four on green) |
| folio-assistant-zufk | `dpi-h-log-watcher-2026-11-07.md` | feedback | DPI-H PC log watcher restart 2026-11-08 and the user's rule that format changes are not feedback |
| folio-assistant-zy2h | `dth-pc-workplan-status.md` | project | dth-pc workplan (#2) gap check 2026-11-01: PC-1 outline never merged, link fix #10, open cards Q-DTH2-1..3 |

_2026-11-12T09:45:00Z_ — Filed by thread "Record handover in beans" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9E8Y9ccXJsk3qvGEie1X5Pr), session https://claude.ai/code/session_01Qmmkt7NmLVnjA5oNtkbv3f.
