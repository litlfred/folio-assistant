---
# folio-assistant-8azk
$schema: bean/1.0.0
title: 'Memory: Owner rule (2026-11-02): node IRIs should not use ''#''; platform namespaces are currently …/v0/ns# (instanceNamespaceOf)'
status: completed
type: task
priority: low
created_at: 2026-11-02T06:16:36Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `iri-no-hash.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Owner rule (2026-11-02): node IRIs should not use '#'; platform namespaces are currently …/v0/ns# (instanceNamespaceOf)


litlfred, 2026-11-02 06:15Z (cmsg_017WNUkNK8kdDziPK58Pv6G9Sc2yrgbGMDmoFCJ5Ke4ziU): "IRIs should not have # for nodes".

Today every instance mints its IRIs under `…/<stub>/v0/ns#` (cat-harness-tools `schemas/kg/namespaces.ts` `instanceNamespaceOf`, and `CAT_NS` too), so term IRIs look like `…/v0/ns#glossary/<scheme>/<term>`.
**Why:** a hash IRI cannot have its own page, and the owner wants nodes to be dereferenceable.
**How to apply:** do not build new features on `#` IRIs, such as fragment redirects. Q-GLO-6 = A (tap 2026-11-02 06:20Z): slash IRIs platform-wide, …/v0/ns/; issue cat-harness-tools#1378; separate thread requested from coordinator. Q-GLO-5 redirect dropped. CLEAN BREAK (owner 06:21Z, cmsg_017WNUkNK8kdDziPK58Pv6G98TdV9Chy7bM76XKTZuLG39): no forwarding or aliases for old # IRIs. Owner asked to inform siblings (06:20Z). core#498 closed. See folio-assistant-rcqp.
