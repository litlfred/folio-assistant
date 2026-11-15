---
# folio-assistant-apim
$schema: bean/1.0.0
title: 'Memory: smart-trust-demo "no right hand grill": 64rem CSS pushed .fa-sec-actions off-screen (tools#1897, PRs tools#1898 + cat-harness#1244) + stale fhir-harn...'
status: completed
type: task
priority: low
created_at: 2026-11-11T13:10:46Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `demo-right-rail-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-trust-demo "no right hand grill": 64rem CSS pushed .fa-sec-actions off-screen (tools#1897, PRs tools#1898 + cat-harness#1244) + stale fhir-harness pin

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9SxasfQF7Sm49rzpH7s62Bp, user 13:04Z 11-11.
- Cause 1 (all sites): LINK_CSS 64rem block (tools#1807) gives .block-actions margin-right:-4rem; section boxes (.fa-sec-actions) inherit it on top of right:-3rem, so the rail sits 7rem right of text, off-screen (1440px window: right edge 1492). Fix margin:0. Issue tools#1897, drafts tools#1898 + cat-harness#1244 (branch claude/sec-rail-onscreen), handed to merge manager.
- Cause 2 (demo only): smart-trust-demo pins fhir-harness 29c20f1 (11-07), before fhir-harness#311 (icons out of headings) and #362 (Contents card). Re-pin to fhir-harness main + fixed tools needs owner consent: Q-RAIL-1 = A (user tap 13:13Z 11-11): one demo PR re-pinning cat-harness-tools to the fixed commit AND fhir-harness to main.
- Before/after: /mnt/project-files/demo-right-rail-2026-11-11/
- Local check script without bun install: clone cat-harness next to cat-harness-tools, bun a script importing EDIT_LINKS_RUNTIME, require playwright from `npm root -g`.
Related: folio-assistant-8jxt, folio-assistant-4tzb.
- 19:56Z: tools#1898 (6f1cadd8) + cat-harness#1244 merged. Demo re-pin PR smart-trust-demo#127 (issue #126, branch claude/repin-right-rail): all harnesses to main via mount:remote --seed; workflow uses: pins updated too (push accepted). SUSHI not runnable in sandbox (packages.fhir.org blocked). Next: merge manager merges on full green, then republish gh-pages (stage-local.ts --publisher ig) and verify rail.
- Gotcha: mount:lock reports cat-harness "missing" after a plain clone because the lock has except [sdlc, work-plan]: rm those dirs first.
- 21:10Z #127 merged (71f1f376). Local republish BLOCKED: fhir-harness#332 injection QA refuses any <script> in IG pagecontent; demo's generated input/pagecontent/business-processes.md (tools/ig-gen/ig_gen.py l.507) loads en/cat-harness/processes/task-panel.js. Figures carry data-panel=...tasks.json. Card Q-RAIL-2 asked (A drop script / B fhir-harness injects panel for data-panel pages / C both).
- Shared publish workflow also fails: no `playwright install` before render:bpmn (reported to merge manager).
- Coordinator 21:13Z: the same #332 block hits smart-trust (Q-TRP-3, Translations thread cmsg_017WNUkNK8kdDziPK58Pv6G95t7cWfzxEoMPbkQnqw15f9, option B = IG trusted-scripts allow-list). Any harness fix: one shared fix, coordinate with that thread.
- If B: I build the one fhir-harness allow-list; must also cover IG-declared same-site scripts (smart-trust input/images/hcert-demo/hcert-demo.js + .wasm), declared e.g. in index.config.json contentTypes.ig; keep browser copy INJECTION_RULES in ast-resource.js in sync.
- Q-RAIL-2 = C (owner tap 2026-11-12 06:07Z): drop script tag in ig_gen.py + publish now; then build ONE fhir-harness trusted-scripts fix (covers smart-trust too).
