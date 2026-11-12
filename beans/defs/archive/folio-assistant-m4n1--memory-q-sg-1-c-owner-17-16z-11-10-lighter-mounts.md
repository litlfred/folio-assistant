---
# folio-assistant-m4n1
$schema: bean/1.0.0
title: 'Memory: Q-SG-1 C (owner 17:16Z 11-10): lighter mounts + all cat-harness/core content groups opt-in in waves; all 9 PRs merged 18:40Z; downstream enable + re-...'
status: completed
type: task
priority: low
created_at: 2026-11-10T17:31:04Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `subgraph-groupings-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Q-SG-1 C (owner 17:16Z 11-10): lighter mounts + all cat-harness/core content groups opt-in in waves; all 9 PRs merged 18:40Z; downstream enable + re-pins left

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9R5a3GBLL4iHycFjXrEiM4Q, 2026-11-10. Analysis doc: https://claude.ai/artifact/9psSEwpqkWTLYenyKVQQnZ

Findings:
- Two levers: opt-in subgraphs (`optIn` + `enableSubgraphs` "<layer>.<id>", not inherited) and mount directory lists. Every downstream mounts `whole: true`.
- cat-harness 184 MB (corpus 123, docs 36, wireframes 17); core 49 MB, own library 29 MB.
- Groups: cat-harness platform-ui (high coupling), kg-ops, editorial (medium), research methodologies, integrations (low); core committee-review, library-ingestion, voices, dsa/board/figures.
- Reverses SZ5A ([[site-size]]), which stopped opt-in for SITE SIZE only.

Owner tapped Q-SG-1 C 17:16Z. Waves: 0 mounts; 1 research methods+integrations / core DSA,board,figures; 2 editorial+kg-ops; 3 platform-ui / core committee-review, library-ingestion, voices. Merges via merge manager.

Wave 0 (11-10 ~18:00Z), all drafts, subscribed:
- tools#1754 (issue #1753): whole mount sparse-excludes opt-in dirs not enabled; lock `except` on the "*" entry; mount-from-lock replays; checkRemote treats excluded as unmounted.
- cat-harness#1179 (issue #1178): docs/proposals optIn, docs/wireframes declared (doc-group) + optIn.
- core#702 (issue #701): library optIn.
- smart-base cites sdlc `staging-review` deep-link rule in its own skills/schemas while sdlc is off for it. Needs a card: move the rule out of sdlc vs enable sdlc in smart-base (smart-* needs OK).
- GOTCHA: `optIn` on core's conventional `library` entry would travel to downstreams that inherit it and hide their OWN library. Core#702 on hold, card Q-SG-3 (A move to library/corpus/ + nested opt-in, rec; B drop core library from wave 0).
- GOTCHA: docs.json entries are not promoted layer dirs, so `enableSubgraphs` for them may be refused; whole-mount exclusion still reads them. cat-harness#1179 self-enable reverted.
- Wave 1 cat-harness#1181 (issue #1180): integrations/ (18 forge/MCP tools) + research/ (4 agentic-SE methods), opt-in, self-enabled. Kept in place because on-by-default skills cite them: user-auth, upload-url, openapi-*, transcribe-*, lsi cluster, wiregen, hybrid-llm, spec-compiled-agents.
- Wave 1 core#704 (issue #703): dsa/ opt-in (4 DSA skills as `dsa` package + dsa-document-lifecycle.bpmn), core self-enables via new `enableSubgraphs`. Pairs with cat-harness#1181 commit 5366a08f (attestations moved). Board + figures deferred to wave 3 (cited by kernel/board-windows, figure-rebuild, committee bpmn).
- Waiting on CI of #1181/#704 to validate the move pattern before waves 2-3.
- 17:43Z owner: Q-SG-3 = A → core#702 now: top-level `core-library-graph` + library/graph.json nested `library` corpus/ optIn; refs keep logical library/<slug> (no rewrite, like cat-harness). Q-SG-2 = A → cat-harness#1183 (issue #1182): rule moved to skills/authoring/content-lifecycle/feedback-deep-links.md; smart-base copies still old path (needs OK).
- Resolver fact: a switched-off from-within entry is skipped BEFORE byId.set, so it never deletes an inherited/default entry of the same id.
- Waves 2-3 (editorial, kg-ops, platform-ui; core board, library-extras) merged 18:40Z with the rest. 19:19Z card B: fa enables cat-harness.proposals/.wireframes/.library (fa#3064 merged). Later work: folio-assistant-h9d1.
- 11-11 01:34Z owner A: re-pin smart-base in fa#3064 (now c65acc3b, smart-base 4c6680d1). 01:40Z B: links into switched-off opt-in groups get a gate + hand fixes; 01:43Z B: fix all first, gate on after (no baseline). Gate found 437. Fix PRs: cat-harness#1226, core#724, sci#192, fhir-harness#366, smart-base#343 (corpus links → external URLs, others unlinked + "(opt-in `grp`)"). tools#1843 (issue #1842): check:optin-links script + readme:sync unlinks opt-in skills. Continued in folio-assistant-h9d1.
