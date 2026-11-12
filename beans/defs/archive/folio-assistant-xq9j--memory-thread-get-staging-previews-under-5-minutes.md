---
# folio-assistant-xq9j
$schema: bean/1.0.0
title: 'Memory: Thread "Get staging previews under 5 minutes" (2026-10-31): analysis doc, measured timings, pending option card'
status: completed
type: task
priority: low
created_at: 2026-10-31T10:48:28Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `staging-preview-speed.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Thread "Get staging previews under 5 minutes" (2026-10-31): analysis doc, measured timings, pending option card


Thread "Get staging previews under 5 minutes" (cmsg_017WNUkNK8kdDziPK58Pv6G9Nt9rGoV1iZ76fPyFEVoSrK) owns preview speed.
Analysis doc: https://claude.ai/artifact/YLv2pPWms95n1oT3Xsd4no
Measured 2026-10-31: preview ~26 min (22 build + ~4 Pages deploy); derive:publish 8 min and KG export 6 min dominate; queue median 3s (p90 <2 min) that day, but up to 43 min on 2026-10-30. gh-pages holds 156,803 files.
Card posted 10:5xZ, options A (cache derive+KG export, dedupe runs, then Cloudflare Pages previews; recommended) / B reuse only / C agent push / D hold. Owner picked B (reuse only) 10:48Z. Owner 10:49Z: "no cloudflare for litlfred/ repos, only WHO/ repos". Never propose Cloudflare for litlfred repos.
Found: derive:publish cache is OFF in CI (no CAT_DERIVE_CACHE_DIR, no actions/cache), so it never hits there.
Owner 10:50Z "wokrk bean fwtz": bean fwtz handed to a sibling thread "Make the cone deploy safe to switch on" (asked coordinator 10:51Z); this thread keeps option B and the skills/BPMN updates. Related: folio-assistant-vosx, folio-assistant-5778.
2026-10-31 11:36Z owner card 'A. Merge both and re-pin': merged tools#1115 (97490ca, staging-share.ts) + fa#2843 (9f2f685), re-pinned tools in fa#2845 (c27093c). Skills PR cat-harness#850 (draft). Drafts are staged now (fa#2836). Open: re-measure preview time and gh-pages size; derive cache keyed on #1102 records when the cone thread is ready.
2026-11-01: cat-harness#850 (skills) merged by others 11:01Z. Measured re-pin preview run 41293948968: stage 26m (derive 13.7m, Jekyll 2.7m, KG export 2.6m). Re-pins change tool code so every writer reruns; a content-only preview is the real test of <5 min. Derive skip + incremental KG export owned by cone thread (fwtz, tools#1149, fa#2853). S1 (g196) measured sharing: 16.7k-18.5k files shared per preview; tools#1208 drops per-node KG stamp on main.
