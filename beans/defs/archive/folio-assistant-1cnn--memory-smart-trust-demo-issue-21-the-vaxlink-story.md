---
# folio-assistant-1cnn
$schema: bean/1.0.0
title: 'Memory: smart-trust-demo issue 21: the VaxLink story (fredhersch/vaxlink) as DAK/IG; draft PR #22, two open cards'
status: completed
type: task
priority: low
created_at: 2026-11-02T11:41:44Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-demo-vaxlink-21.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: smart-trust-demo issue 21: the VaxLink story (fredhersch/vaxlink) as DAK/IG; draft PR #22, two open cards


Issue litlfred/smart-trust-demo#21 (2026-11-02): document the VaxLink walkthrough (https://fredhersch.github.io/vaxlink/, repo fredhersch/vaxlink, NOT a litlfred repo) as DAK + IG in smart-trust-demo, materialize its FHIR examples, and have the vaxlink page use them.

- Draft PR #22, branch claude/vaxlink-journey-dak. Thread cmsg_017WNUkNK8kdDziPK58Pv6G9Lw37KnRcSE6WtastUrRAW8.
- Q-STD-1 answered A (11:48Z): the VaxLink cast is adopted and recorded in repo memory/dir-vaxlink-story.md (commit 73c1b59).
- Q-STD-2 withdrawn (11:50Z). The user asked for a sub-issue of fredhersch/vaxlink#6 with the patch attached. Blocked: no push or API access to fredhersch/vaxlink. Ready-to-paste body: /mnt/project-files/smart-trust-demo-21/vaxlink-subissue.md. The old card asked how the vaxlink patch (/mnt/project-files/smart-trust-demo-21/vaxlink-use-ig-examples.patch) reaches fredhersch: A fork to litlfred + PR (rec), B the user sends it, C leave it.
- The PR is DAK content, so it is never self-merged. The staging preview is a folio docs site: IG example pages and JSON go live only after merge to main and the AST refresh.
- 11-02: user forked to litlfred/vaxlink (issues disabled there). Draft PR litlfred/vaxlink#1 (branch claude/issue-6-ig-demo, f8a1505) does all 14 points of fredhersch/vaxlink#6: IG example payloads, moment illustrations, baby persona, hash routes (#/walkthrough/J3b, #/demo/S4), standards links, ConceptMap illustration, DPI-H RA architecture, BPMN SVGs. Builds in the fork. Preview needs Actions + Pages source "GitHub Actions" on the fork and deploys only from fork main. Q-VXL-1 = A: merged into fork main 12:05Z (31efdf4). No deploy run seen; Actions enabled by user. Q-VXL-2 = A: site published from gh-pages branch (built dist + .nojekyll, pushed by agent); rebuild and push gh-pages after each change to main.
- 12:28Z Q-VXL-3 = A: standing OK to merge litlfred/vaxlink fork PRs myself and rerun `sh scripts/publish-gh-pages.sh` from fork main after each merge (vaxlink#2 people scenes/profiles/RA-layer architecture, #3 BPMN row on journey map: both merged).
- PR #22 now also has Thai (3) and Lao (8) profiles with how/why descriptions, Thai J1 examples, and a new landing page (docs/index.md is the IG home; ig_gen inlines docs/images/*.svg via data-svg). Staging preview publishes.
- 12:37Z Q-STD-3 = A: cast renamed so only the baby starts with "So": CHW Soukanh -> Vilay, Dr Somchai -> Dr Anan (both repos; vaxlink#4 merged, PR #22 1d49ce0). Four-moment illustrations are the owner's image (vaxlink public/moments/*.jpg, smart-trust-demo docs/images/moment-*.jpg); J3 clinic sign redrawn in Lao script ສຸກສາລາເມືອງ (Noto Sans Lao via npm @fontsource) - ask a Lao reader to confirm.
- 12:50Z user asked where IHE VHL / smart-trust issues are: none filed from vaxlink work (only earlier smart-trust-phw#18, closed). Card Q-STD-4 (A check+file / B draft / C none). Pre-check done: IHE ITI.VHL has audit as MAY requirements (AuditEventAccess, "SHOULD conform to ATNA") but no AuditEvent/BALP profile for ITI-YY5 incl. failed passcode; smart-trust-phw has no guidance on reported-vs-verified DVC import (no primarySource/Provenance hits) and personas.md/scenarios.md are still "[insert health domain here]" placeholders. No duplicate issues found.
- 13:0xZ user: the upstream issues were about terms of use. Found litlfred work only (smart-trust#105/PR#106, phw PR#22/#20, pilgrimage #4/#2/PR#5, smart-ra#202); none on IHE VHL or WHO smart-trust. Card Q-STD-5 (msg cmsg_017WNUkNK8kdDziPK58Pv6G93oFVRmDtZDGopadbsBAKD4) replaces Q-STD-4: A check+file both / B draft / C A plus the Q-STD-4 gaps (rec) / D none.
- 12:58Z Q-STD-5 = A: filed WorldHealthOrganization/smart-trust#147 (Trust Domain terms of use). IHE ITI.VHL issue refused (403, no Claude App on IHE); body at /mnt/project-files/smart-trust-demo-21/ihe-vhl-termsofuse-issue.md for the user to file. Q-STD-4 gaps not filed (user picked A, not C).
- 14:07Z user filed IHE/ITI.VHL#49 (terms of use); linked from WHO smart-trust#147.
- 17:53Z user merged PR #22 (817d43a). IG AST refresh workflow publishes the IG root; agent stage-local root publish refused by parity guard (build lacks artifact/, ast-data/, fhir-artifact-index/, stamp) - expected, the workflow owns those. Thread resolved.
