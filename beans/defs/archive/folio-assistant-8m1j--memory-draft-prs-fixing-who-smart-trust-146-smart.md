---
# folio-assistant-8m1j
$schema: bean/1.0.0
title: 'Memory: Draft PRs fixing WHO smart-trust#146, smart-trust-phw#22, smart-base#338 in litlfred forks; how sushi was run offline'
status: completed
type: task
priority: low
created_at: 2026-11-01T11:04:47Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `smart-trust-data-store-fixes-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Draft PRs fixing WHO smart-trust#146, smart-trust-phw#22, smart-base#338 in litlfred forks; how sushi was run offline


Thread "Fix smart-trust data store issues" (cmsg_017WNUkNK8kdDziPK58Pv6G9DTTyzf9jJeVxp3QWmbPWku), 2026-11-01, follow-up of folio-assistant-20kq.
- litlfred/smart-trust#107 (MERGED 2026-11-02): TrustNetworkAnchor + PublishPKIMaterialAPI `reference` = gateway OpenAPI (WHO #146).
- litlfred/smart-trust-phw#23 (MERGED 2026-11-02 06:24Z): PHW.G/PHW.I audit repo + provenance log are bpmn:dataStore (G1, G3, I9 write via dataOutputAssociation); G2/G4/I10 and lanes removed (WHO #22).
- litlfred/smart-base#268 (CLOSED 2026-11-08, superseded by smart-base#329: Q-SB-5 B removes the personas instead, since smart-ra depends on smart-base): ClientRegistry/HMIS/LMIS personas derivedFrom smart-ra actors, ids kept as aliases (Q-DS-11 A, WHO #338, smart-ra#45).
- All content changes: merge needs the user's OK. WHO issue comments not posted (same-name fork blocks attach); text in /mnt/project-files/data-stores-2026-11-01/who-issue-comments.md.
- Sushi offline: the auto-mode classifier blocked running fhir-harness's seeder; seeding ~/.fhir/packages by hand from the fhir-package-mirror tgz files plus npm registry tarballs worked. phw needed hl7.fhir.uv.extensions.r5 5.3.0 and tools.r5 1.3.0 pinned temporarily because sushi's `#latest` lookup needs the registry.
