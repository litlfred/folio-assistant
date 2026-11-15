---
# folio-assistant-yz7s
$schema: bean/1.0.0
title: 'Memory: IG Contents card on the right (Artifacts Summary layout C + narrative pages) and </br> fix — fhir-harness#361 / PR #362'
status: completed
type: task
priority: low
created_at: 2026-11-10T21:28:45Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `ig-contents-card-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: IG Contents card on the right (Artifacts Summary layout C + narrative pages) and </br> fix — fhir-harness#361 / PR #362

User 21:22Z 11-10 (thread cmsg_017WNUkNK8kdDziPK58Pv6G9AHPLQzwq76eDZbcNy1iDiT): Artifacts Summary should have an IG-style TOC on the right, as a neutral card (not yellow). Picked layout C from mockups (card beside "This guide", tables full width). Then: "adopt that for other IG pages as well".
- fhir-harness `scripts/templates/ig-pages/ig-artifact.js` drawContents + `igi-head`; `breaks()` turns <br>/</br> into paragraphs.
- Narrative pages: `IG_CONTENTS_JS` (h2s, needs >=2) inlined in thinIgLayout + harnessLayout; CSS block between IG-CONTENTS-CARD markers in ig-artifact.css, read as `IG_CONTENTS_CSS`.
- Issue fhir-harness#361, PR #362 MERGED 21:32Z 11-10 (499a68a). Live after IG re-pins of fhir-harness.
- Mockups/screens: /mnt/project-files/artifacts-toc-2026-11-10/
- Local test setup: siblings cat-harness-tools, cat-harness, bootstrap-tools, folio-assistant-core under /home/user; symlink node_modules/@litlfred/{cat-harness-tools,bootstrap-tools}.
