---
# folio-assistant-20kq
$schema: bean/1.0.0
title: 'Memory: Data store inventory and consistency pattern (2026-11-01): report link, findings, cards Q-DS-1..6, interpreter blocker'
status: completed
type: task
priority: low
created_at: 2026-11-01T10:22:46Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `data-stores-2026-11-01.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Data store inventory and consistency pattern (2026-11-01): report link, findings, cards Q-DS-1..6, interpreter blocker


Thread "Define data stores consistently across harnesses" (cmsg_017WNUkNK8kdDziPK58Pv6G97nNpQM17xvcJa7CrtTvdZb), sibling of the BPMN guidance review (folio-assistant-tx6r).
- Report doc: https://claude.ai/artifact/K14vtYSyfagmLtmJiGnX4S. No repo changed.
- 18 stores, 5 description styles: mechanical Role + contract skill (cat-harness roles work-plan, corpus, log, session-record, publish-target; bootstrap KG Data Store), 29 store lanes, who-iris bpmn:resource+partitionElementRef, ContentDirectory.storage (QA results), FHIR ActorDefinition type=system + ArchiMate (smart-ra 48 components/21 data objects/2 generic interfaces).
- Only bootstrap knowledge-graph-data-store has a tested contract. Real API docs exist only for smart-trust gateway (OpenAPI, ingested by cat-harness openapi subgraph) and pilgrimage VHL CapabilityStatement. beans has a GraphQL schema (litlfred/beans internal/graph/schema.graphqls) that nothing references.
- Blocker: cat-harness-tools src/workflow/process-model.ts refuses dataStoreReference (UnsupportedBpmn); diagram-fix thread (cmsg_017WNUkNK8kdDziPK58Pv6G9LyZ6EoJf3PFkSRsG3DNWK5) paused store-lane redraw until the cards are answered.
- Cards sent to coordinator 2026-11-01 ~10:40Z, all rec A: Q-DS-1 store = Role + store block; Q-DS-2 two-layer API docs (native doc verbatim + tested contract skill); Q-DS-3 shared data-stores.bpmn with global bpmn:dataStore; Q-DS-4 lane only if the system does its own step; Q-DS-5 draft issues on smart-ra and smart-trust-phw, post after OK; Q-DS-6 Corpus specialises bootstrap KG Data Store.
- 10:30Z: merged duplicate thread cmsg_017WNUkNK8kdDziPK58Pv6G9J7v5uSckMqrnYhqVBEo7XM (findings /mnt/project-files/data-store-consistency-2026-11-01/findings.md). Added Q-DS-7 (tool io JSON Schema generated from Zod; 167 tools scalar-only, 16/261 skills have schemas) and Q-DS-8 (ArchiMate store/schema/api/actorDefinition properties like skosConcept, enforced by archimate-check). Q-DS-5 drafts now also cover smart-ra/smart-base duplicate ClientRegistry/HMIS/LMIS and the unlinked smart-trust gateway OpenAPI.
- 10:33Z "go on DS changes" = A on all cards. tools#1252 (store blocks in interpreter + archimate checks) then cat-harness#907 (store blocks, global dataStore, work-plan-store skill). Still to do: regenerate cat-harness scenarios.schema.json (needs full harness mount).
- Correction: tool io types ARE Zod-generated (56 TOOL_TYPES, tool-types/<Name>.schema.json, mcp-contract); gap is 80 Text/Markdown outputs. Cards Q-DS-9 (file smart-* issues from /mnt/project-files/data-stores-2026-11-01/issue-drafts.md) and Q-DS-10 (structured outputs, store tools first) sent ~10:55Z.
- 10:57Z: tools#1252 MERGED (2163090). Q-DS-11 A: smart-ra is the canonical Client Registry/HMIS/LMIS; smart-base personas should point to it (comment on WHO smart-base#338; smart-ra#45 is the linking issue). Q-DS-10 group 1 types in tools#1260. Plan: /mnt/project-files/data-stores-2026-11-01/tool-output-groups.md.
- 12:00Z tools#1260 MERGED (9546239); cat-harness#921 (issue #920) adds result outputs to 4 store tools. #907 and #921 wait on fa tools re-pin; Q-DS-13 A (15:21Z) but fa#2864 already pins f35a491 (covers both), so no separate re-pin; merge both after fa#2864 lands.
- 16:15Z tools#1278 MERGED (050ab03, BeanQueryRows+HarnessStates). Group 2 workflow tools: tools#1283 (structuredContent).
- 2026-11-02 02:26Z cat-harness#907 (6fe1e27) and #921 (c400ea5) MERGED after re-pin train fa#2893 pinned tools f92092e; issues #906/#920 closed. Next: cat-harness PR adding result outputs to bean-query, harness-state, workflow tools, gates/gates-merged; then group 3 forge tools.
